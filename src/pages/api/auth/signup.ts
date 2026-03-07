import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json() as Record<string, any>;

    const { email, password, fullName } = body;

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return new Response(
        JSON.stringify({
          error: error.message || 'Failed to create account',
        }),
        { status: 400 }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'Account created but no session returned' }),
        { status: 500 }
      );
    }

    // If signup succeeds, we have a session
    if (data.session) {
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
          message: 'Account created successfully',
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        }),
        { status: 201 }
      );
    }

    // User created but no immediate session (e.g., email confirmation required)
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Account created. Please check your email to confirm.',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
