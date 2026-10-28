// Supabase Edge Function: notify
//
// Receives a composed notification and hands it to an SMS/WhatsApp provider.
// The provider call is intentionally stubbed behind `deliver()` — drop in
// Twilio, Meta WhatsApp Cloud API, etc. there without touching the app. No
// email, no payments.
//
// Deploy: supabase functions deploy notify

interface NotifyPayload {
  kind: 'confirmation' | 'reminder' | 'cancellation';
  to: string; // E.164
  body: string;
}

interface DeliveryResult {
  delivered: boolean;
  provider: string;
  reason?: string;
}

/** STUB: wire your real provider here. */
async function deliver(payload: NotifyPayload): Promise<DeliveryResult> {
  // Example shape for a real provider:
  //   const res = await fetch(PROVIDER_URL, { method: 'POST', headers, body: ... });
  //   return { delivered: res.ok, provider: 'twilio' };
  console.log(`[notify:${payload.kind}] -> ${payload.to}: ${payload.body}`);
  return { delivered: false, provider: 'stub', reason: 'no provider configured' };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  let payload: NotifyPayload;
  try {
    payload = (await req.json()) as NotifyPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (!payload.to || !payload.body) {
    return new Response(JSON.stringify({ error: 'missing to/body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  const result = await deliver(payload);
  return new Response(JSON.stringify({ ok: true, ...result }), {
    headers: { 'content-type': 'application/json' },
  });
});
