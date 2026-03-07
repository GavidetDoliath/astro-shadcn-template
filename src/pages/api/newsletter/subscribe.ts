import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
      });
    }

    const { email } = await request.json() as { email?: string };

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // Call Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/newsletter-subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
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
    console.error('Newsletter subscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
