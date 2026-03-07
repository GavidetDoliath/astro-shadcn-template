import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
      });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Call Supabase Edge Function, forwarding the signature
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'stripe-signature': signature,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), { status: response.status });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
