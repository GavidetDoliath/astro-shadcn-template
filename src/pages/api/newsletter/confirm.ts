import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
      });
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400 });
    }

    // Call Supabase Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/newsletter-confirm?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), { status: response.status });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter confirm error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
