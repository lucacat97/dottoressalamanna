// supabase/functions/request-consultation/index.ts
// Riceve la richiesta di consulenza singola da un professionista,
// la salva su DB e invia notifica email all'admin + conferma al richiedente.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttachmentInput {
  path: string
  name: string
  size: number
}

interface RequestBody {
  notes?: string
  attachments?: AttachmentInput[]
}

const ADMIN_EMAIL = 'dott.lamanna.a@gmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Auth: validate JWT
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const user = userData.user

    // Validate body
    const body = (await req.json()) as RequestBody
    const notes = (body.notes || '').toString().slice(0, 4000)
    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 8) : []

    for (const a of attachments) {
      if (!a.path || typeof a.path !== 'string' || !a.path.startsWith(`${user.id}/`)) {
        return new Response(JSON.stringify({ error: 'Invalid attachment path' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      ''

    // Generate signed URLs (7 days)
    const signedAttachments: Array<{ name: string; url: string; size: number; path: string }> = []
    for (const a of attachments) {
      const { data: signed, error: signErr } = await admin.storage
        .from('consultation-attachments')
        .createSignedUrl(a.path, 60 * 60 * 24 * 7)
      if (signErr) {
        console.error('signed url error', signErr, a.path)
        continue
      }
      signedAttachments.push({ name: a.name, url: signed.signedUrl, size: a.size, path: a.path })
    }

    // Save record
    const { data: inserted, error: insertErr } = await admin
      .from('consultation_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_full_name: fullName || null,
        notes: notes || null,
        attachments: signedAttachments.map((s) => ({ name: s.name, path: s.path, size: s.size })),
        status: 'pending',
      })
      .select()
      .single()

    if (insertErr) {
      console.error('insert error', insertErr)
      return new Response(JSON.stringify({ error: 'Failed to save request' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const createdAt = new Date(inserted.created_at).toLocaleString('it-IT', {
      timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short',
    })

    // Send admin notification (template has fixed recipient)
    const adminInvoke = admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'consultation-request',
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey: `consult-admin-${inserted.id}`,
        templateData: {
          professionistaNome: fullName || user.email,
          professionistaEmail: user.email,
          note: notes,
          allegati: signedAttachments.map((s) => ({ name: s.name, url: s.url })),
          createdAt,
        },
      },
    })

    // Send confirmation to professional
    const userInvoke = admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'consultation-confirmation',
        recipientEmail: user.email,
        idempotencyKey: `consult-user-${inserted.id}`,
        templateData: { nome: fullName ? fullName.split(' ')[0] : '' },
      },
    })

    await Promise.allSettled([adminInvoke, userInvoke])

    return new Response(JSON.stringify({ success: true, id: inserted.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('request-consultation error', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
