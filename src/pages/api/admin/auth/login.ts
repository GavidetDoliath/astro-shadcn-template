import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  console.log('[LOGIN] Starting login attempt');
  console.log('[LOGIN] Supabase URL:', supabaseUrl ? 'set' : 'MISSING');
  console.log('[LOGIN] Anon Key:', supabaseAnonKey ? 'set' : 'MISSING');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[LOGIN] Missing Supabase configuration');
    const response = JSON.stringify({ error: 'Supabase not configured' });
    return new Response(response, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method !== 'POST') {
    const response = JSON.stringify({ error: 'Method not allowed' });
    return new Response(response, {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[LOGIN] Parsing request body');
    const body = (await request.json()) as { email?: string; password?: string };
    const { email, password } = body;

    console.log('[LOGIN] Email:', email);

    if (!email || !password) {
      const response = JSON.stringify({ error: 'Email and password are required' });
      return new Response(response, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[LOGIN] Creating Supabase client');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    console.log('[LOGIN] Attempting authentication');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[LOGIN] Auth error:', error.message);
      const response = JSON.stringify({ error: error.message || 'Invalid credentials' });
      return new Response(response, {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data.session) {
      console.error('[LOGIN] No session returned');
      const response = JSON.stringify({ error: 'No session created' });
      return new Response(response, {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[LOGIN] Setting cookies');
    const cookieOptions = {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict' as const,
      path: '/',
    };

    cookies.set('sb-access-token', data.session.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60,
    });

    cookies.set('sb-refresh-token', data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log('[LOGIN] Success');
    const response = JSON.stringify({ ok: true });
    return new Response(response, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[LOGIN] Error:', errorMsg);
    console.error('[LOGIN] Full error:', error);
    const response = JSON.stringify({ error: errorMsg || 'Internal server error' });
    return new Response(response, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
