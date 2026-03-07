import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
      });
    }

    const { email, token } = await request.json() as { email?: string; token?: string };

    if (!email && !token) {
      return new Response(
        JSON.stringify({ error: 'Either email or token is required' }),
        { status: 400 }
      );
    }

    // Call Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/newsletter-unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
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
    console.error('Newsletter unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
      });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!email && !token) {
      return new Response(
        JSON.stringify({ error: 'Either email or token is required' }),
        { status: 400 }
      );
    }

    // Call Supabase Edge Function with query params
    const queryString = new URLSearchParams();
    if (email) queryString.set('email', email);
    if (token) queryString.set('token', token);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/newsletter-unsubscribe?${queryString}`,
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
    console.error('Newsletter unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
