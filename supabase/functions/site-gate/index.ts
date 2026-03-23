import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// SHA-256 hash of the site password
const PASSWORD_HASH = "94499df1027d64ea9be1714dcb252fd0af43361196f95a184800696bb2457cac";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  return expected === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const { action, password, token } = await req.json();

    if (action === "verify-password") {
      if (!password || typeof password !== "string") {
        return new Response(JSON.stringify({ valid: false }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const inputHash = await sha256(password);
      if (inputHash !== PASSWORD_HASH) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Password correct — issue a signed token
      const payload = `site-access:${Date.now()}`;
      const signature = await hmacSign(payload, secret);
      const accessToken = `${payload}:${signature}`;

      return new Response(JSON.stringify({ valid: true, token: accessToken }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify-token") {
      if (!token || typeof token !== "string") {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const lastColon = token.lastIndexOf(":");
      if (lastColon === -1) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = token.slice(0, lastColon);
      const sig = token.slice(lastColon + 1);
      const valid = await hmacVerify(data, sig, secret);

      return new Response(JSON.stringify({ valid }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("site-gate error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
