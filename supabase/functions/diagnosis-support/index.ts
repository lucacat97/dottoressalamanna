import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import metodologia from "./metodologia.json" with { type: "json" };
import courseKnowledge from "./course-knowledge.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTHLY_LIMIT = 30;
const TOOL_NAME = "diagnosis-support";

import { DIAGNOSIS_SYSTEM_PROMPT as SYSTEM_PROMPT } from "../_shared/ai-prompts.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authenticate user via JWT ──
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
      return new Response(JSON.stringify({ error: "Sessione non valida. Effettua nuovamente il login." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // ── Server-side access check: admin OR active subscription ──
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const apiKeyId: string | null = null;
    {
      const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
      const { data: hasSubLive } = await serviceClient.rpc("has_active_subscription", { user_uuid: userId, check_env: "live" });
      const { data: hasSubSbx } = await serviceClient.rpc("has_active_subscription", { user_uuid: userId, check_env: "sandbox" });
      if (!isAdmin && !hasSubLive && !hasSubSbx) {
        return new Response(
          JSON.stringify({ error: "Nessuna consulenza disponibile. Attiva un abbonamento MILA per generare consulenze." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }


    const { documentText, clinicalNotes, terapie } = await req.json();

    if (!documentText || typeof documentText !== "string" || documentText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Testo del documento troppo breve o mancante." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch accumulated retro-feedback for this tool
    const { data: feedbackRows } = await serviceClient.rpc("get_tool_feedback", { _tool_name: TOOL_NAME });
    const feedbackSection = feedbackRows && feedbackRows.length > 0
      ? `\n\n=== RETRO-FEEDBACK DAL PROFESSIONISTA (CORREZIONI ACCUMULATE) ===\nQueste sono indicazioni fornite dal professionista dopo aver analizzato consulenze precedenti. DEVI tenerne conto SEMPRE nelle analisi future per evitare gli stessi errori:\n${feedbackRows.map((r: { feedback: string }, i: number) => `${i + 1}. ${r.feedback}`).join("\n")}\n=== FINE RETRO-FEEDBACK ===`
      : "";

    // Fetch active knowledge base entries (global + diagnosis-specific)
    const { data: knowledgeRows } = await serviceClient.rpc("get_active_ai_knowledge", { _scope: "diagnosis" });
    const knowledgeSection = knowledgeRows && knowledgeRows.length > 0
      ? `\n\n=== KNOWLEDGE BASE AGGIUNTIVA ===\nLe seguenti informazioni sono state fornite dall'amministratore come contesto aggiuntivo. Tienine conto durante l'analisi:\n${knowledgeRows.map((r: { title: string; content: string }, i: number) => `${i + 1}. [${r.title}]\n${r.content}`).join("\n\n")}\n=== FINE KNOWLEDGE BASE ===`
      : "";

    // Build clinical notes section if provided
    const clinicalNotesSection = clinicalNotes && typeof clinicalNotes === "string" && clinicalNotes.trim().length > 0
      ? `\n\n--- CONSIDERAZIONI CLINICHE DEL PROFESSIONISTA (RETRO-FEEDBACK) ---\n${clinicalNotes.trim()}\n--- FINE CONSIDERAZIONI ---`
      : "";

    const terapieSection = terapie && typeof terapie === "string" && terapie.trim().length > 0
      ? `\n\n--- TERAPIE CONSIGLIATE DAL PROFESSIONISTA ---\nIncludi nella consulenza SOLO le seguenti terapie: ${terapie.trim()}\nNon aggiungere altre terapie non elencate qui.\n--- FINE TERAPIE ---`
      : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + knowledgeSection + feedbackSection },
          {
            role: "user",
            content: `Analizza i seguenti dati clinici e genera il consulenza finale completo rispettando rigorosamente struttura, ordine, logica clinica, tono e stile descritti nelle istruzioni.${clinicalNotesSection}${terapieSection}\n\n---\n${documentText}\n---`,
          },
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

    // ── Log usage server-side ──
    await serviceClient.from("ai_usage_log").insert({ user_id: userId, tool_name: TOOL_NAME });
    if (apiKeyId) {
      await serviceClient.from("api_usage_log").insert({ api_key_id: apiKeyId, tool_name: "diagnosis" });
      await serviceClient.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKeyId);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("diagnosis-support error:", e);
    return new Response(
      JSON.stringify({ error: "Si è verificato un errore interno. Riprova più tardi." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
