import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email et mot de passe requis' }), { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return new Response(JSON.stringify({ error: error?.message || 'Identifiants invalides' }), { status: 401 });
  }

  const { access_token, refresh_token } = data.session;
  const secure = import.meta.env.NODE_ENV === 'production' ? '; Secure' : '';

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `sb-access-token=${access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure}`);
  headers.append('Set-Cookie', `sb-refresh-token=${refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);

  return new Response(JSON.stringify({ success: true }), { headers });
};
