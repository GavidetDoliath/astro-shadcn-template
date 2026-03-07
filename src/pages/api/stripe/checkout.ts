import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
      });
    }

    // Get access token from cookies
    const cookie = request.headers.get('cookie');
    const accessTokenMatch = cookie?.match(/sb-access-token=([^;]+)/);
    const accessToken = accessTokenMatch?.[1];

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Call Supabase Edge Function with Bearer token
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
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
    console.error('Stripe checkout error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
