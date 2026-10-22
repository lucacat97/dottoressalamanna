// Genera i documenti scaricabili dal sito (area riservata) con lo STESSO
// template usato dall'API esterna: layout AMCOP per la cefalometria
// (Word .docx a due colonne e PDF editabile) e layout standard per il check-up.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  AMCOP_DEVICES,
  AMCOP_LOGO_STORAGE_PATH,
  AMCOP_STORAGE_BUCKET,
  detectAmcopDevice,
  type AmcopDeviceKey,
} from "../_shared/amcop.ts";
import { buildAmcopDocx } from "../_shared/amcop-docx.ts";
import { buildAmcopPdf, PDF_MIME } from "../_shared/amcop-pdf.ts";
import { markdownToDocx, DOCX_MIME } from "../_shared/docx-generator.ts";
import { buildMarkdownPdf } from "../_shared/markdown-pdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIAGNOSIS_DISCLAIMER =
  "La consulenza è uno strumento di supporto al ragionamento clinico e non costituisce diagnosi medica: la responsabilità diagnostica e terapeutica resta interamente in capo al professionista sanitario.";

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
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessione non valida. Effettua nuovamente il login." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { markdown, patientName, tool, format } = body as {
      markdown?: string; patientName?: string; tool?: string; format?: string;
    };
    if (!markdown || typeof markdown !== "string" || markdown.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Contenuto della consulenza mancante." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tool !== "orthodontic" && tool !== "diagnosis") {
      return new Response(JSON.stringify({ error: "Tipo di consulenza non supportato." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (format !== "docx" && format !== "pdf") {
      return new Response(JSON.stringify({ error: "Formato non supportato." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const date = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const name = (patientName && patientName.trim()) || "Paziente";

    let bytes: Uint8Array | null = null;
    let mime = "";
    let baseName = "";

    if (tool === "orthodontic") {
      // Il dispositivo consigliato è quello già scelto dal template nella consulenza
      // (foto servita come amcop-image?d=<chiave>); in mancanza si rileva dal testo.
      const fromUrl = markdown.match(/amcop-image\?d=([a-z]+)/i)?.[1]?.toUpperCase();
      const deviceKey: AmcopDeviceKey =
        fromUrl && fromUrl in AMCOP_DEVICES
          ? (fromUrl as AmcopDeviceKey)
          : detectAmcopDevice(markdown);
      const device = AMCOP_DEVICES[deviceKey];
      const storageImage = async (path: string): Promise<Uint8Array | null> => {
        try {
          const { data, error } = await serviceClient.storage.from(AMCOP_STORAGE_BUCKET).download(path);
          if (error || !data) return null;
          return new Uint8Array(await data.arrayBuffer());
        } catch { return null; }
      };
      const [devImg, logo] = await Promise.all([
        storageImage(device.storagePath),
        storageImage(AMCOP_LOGO_STORAGE_PATH),
      ]);
      const amcopData = {
        patientName: name, date, logo,
        deviceImage: devImg, deviceImageAlt: device.name,
        rangeImages: [], rangeCaption: "GAMMA AMCOP — forme DCM da definire dopo scansione",
      };
      if (format === "docx") {
        bytes = await buildAmcopDocx(markdown, amcopData);
        if (!bytes) {
          bytes = await markdownToDocx(markdown, "Consulenza Cefalometrica", {
            images: devImg ? { [device.imageUrl]: devImg } : {},
            headerLogo: logo,
            headerTagline: "Consulenza Cefalometrica — Metodo AMCOP · Funzione · Crescita · Postura",
          });
        }
        mime = DOCX_MIME;
        baseName = "consulenza_cefalometrica";
      } else {
        bytes = await buildAmcopPdf(markdown, { ...amcopData, rangeLabels: [] });
        if (!bytes) bytes = await buildMarkdownPdf(markdown, "Consulenza Cefalometrica", DIAGNOSIS_DISCLAIMER);
        mime = PDF_MIME;
        baseName = "consulenza_cefalometrica";
      }
    } else {
      // Check-up ortodontico posturale: stesso formato documentale dell'API (diagnosis).
      if (format === "docx") {
        bytes = await markdownToDocx(markdown, "Consulenza sul caso");
        mime = DOCX_MIME;
        baseName = "consulenza_checkup_posturale";
      } else {
        bytes = await buildMarkdownPdf(markdown, "Consulenza sul caso", DIAGNOSIS_DISCLAIMER);
        mime = PDF_MIME;
        baseName = "consulenza_checkup_posturale";
      }
    }

    const fileName = `${baseName}_${new Date().toISOString().slice(0, 10)}.${format}`;
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("consultation-document error:", e);
    return new Response(
      JSON.stringify({ error: "Si è verificato un errore nella generazione del documento. Riprova." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
