import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'No refresh token found' }),
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Refresh session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      console.error('Token refresh error:', error);
      // Clear invalid cookies
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
      return new Response(
        JSON.stringify({ error: 'Failed to refresh session' }),
        { status: 401 }
      );
    }

    // Update cookies with new tokens
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
        message: 'Session refreshed',
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Refresh error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
