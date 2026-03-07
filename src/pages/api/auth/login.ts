import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json() as Record<string, any>;

    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      console.error('Supabase signin error:', error);
      return new Response(
        JSON.stringify({
          error: error.message || 'Invalid email or password',
        }),
        { status: 401 }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({ error: 'No session returned from signin' }),
        { status: 500 }
      );
    }

    // Set HttpOnly cookies
    cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      path: '/',
      maxAge: 3600, // 1 hour
    });

    cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      path: '/',
      maxAge: 604800, // 7 days
    });

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Login error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
