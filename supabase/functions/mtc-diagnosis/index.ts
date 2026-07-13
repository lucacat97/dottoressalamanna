import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTHLY_LIMIT = 30;

import { MTC_SISTEMICA_PROMPT, MTC_ORGANICA_PROMPT } from "../_shared/ai-prompts.ts";



serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autenticato." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessione non valida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { subTool, sex, painPoints, symptoms, age } = body;

    if (!subTool || !["sistemica", "organica"].includes(subTool)) {
      return new Response(
        JSON.stringify({ error: "Campo 'subTool' obbligatorio. Valori: 'sistemica' o 'organica'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toolName = `mtc_${subTool}`;

    // ── Server-side license check ──
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let apiKeyId: string | null = null;
    {
      const { data: keyRecords } = await serviceClient
        .from("api_keys")
        .select("id, tools")
        .eq("client_email", user.email)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const keyRecord = keyRecords?.[0];
      if (!keyRecord || !Array.isArray(keyRecord.tools) || !keyRecord.tools.includes(toolName)) {
        return new Response(
          JSON.stringify({ error: "Accesso allo strumento non abilitato per il tuo account." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      apiKeyId = keyRecord.id;
    }

    // Rate limiting
    const { data: usageCount } = await serviceClient.rpc("get_monthly_ai_usage", {
      _user_id: userId,
      _tool_name: toolName,
    });
    if (usageCount !== null && usageCount >= MONTHLY_LIMIT) {
      return new Response(
        JSON.stringify({ error: `Limite mensile raggiunto (${MONTHLY_LIMIT} analisi/mese).` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch accumulated retro-feedback
    const { data: feedbackRows } = await serviceClient.rpc("get_tool_feedback", { _tool_name: toolName });
    const feedbackSection = feedbackRows && feedbackRows.length > 0
      ? `\n\n=== RETRO-FEEDBACK DAL PROFESSIONISTA (CORREZIONI ACCUMULATE) ===\nQueste sono indicazioni fornite dal professionista dopo aver analizzato consulenze precedenti. DEVI tenerne conto SEMPRE:\n${feedbackRows.map((r: { feedback: string }, i: number) => `${i + 1}. ${r.feedback}`).join("\n")}\n=== FINE RETRO-FEEDBACK ===`
      : "";

    // Fetch active knowledge base entries (global + mtc)
    const { data: knowledgeRows } = await serviceClient.rpc("get_active_ai_knowledge", { _scope: "mtc" });
    const knowledgeSection = knowledgeRows && knowledgeRows.length > 0
      ? `\n\n=== KNOWLEDGE BASE AGGIUNTIVA ===\n${knowledgeRows.map((r: { title: string; content: string }, i: number) => `${i + 1}. [${r.title}]\n${r.content}`).join("\n\n")}\n=== FINE KNOWLEDGE BASE ===`
      : "";

    let systemPrompt: string;
    let userMessage: string;

    if (subTool === "sistemica") {
      if (!painPoints || !Array.isArray(painPoints) || painPoints.length === 0) {
        return new Response(
          JSON.stringify({ error: "Seleziona almeno un punto doloroso sul corpo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = MTC_SISTEMICA_PROMPT;
      const pointsList = painPoints.map((p: { region: string; description: string }, i: number) =>
        `${i + 1}. Regione: ${p.region} — Descrizione: ${p.description}`
      ).join("\n");
      userMessage = `Paziente: Sesso ${sex || "non specificato"}\n\nPunti dolorosi segnalati:\n${pointsList}`;
    } else {
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return new Response(
          JSON.stringify({ error: "Seleziona almeno un sintomo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = MTC_ORGANICA_PROMPT;
      const symptomsList = symptoms.map((s: { category: string; name: string }) =>
        `- [${s.category}] ${s.name}`
      ).join("\n");
      userMessage = `Paziente: Sesso ${sex || "non specificato"}, Età ${age || "non specificata"}\n\nSintomi riportati:\n${symptomsList}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt + knowledgeSection + feedbackSection },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste. Riprova tra qualche minuto." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Errore nel servizio AI. Riprova più tardi." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await serviceClient.from("ai_usage_log").insert({ user_id: userId, tool_name: toolName });
    if (apiKeyId) {
      await serviceClient.from("api_usage_log").insert({ api_key_id: apiKeyId, tool_name: toolName });
      await serviceClient.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKeyId);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mtc-diagnosis error:", e);
    return new Response(
      JSON.stringify({ error: "Si è verificato un errore interno. Riprova più tardi." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
