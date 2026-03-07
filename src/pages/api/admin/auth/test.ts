import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    return new Response(
      JSON.stringify({
        ok: true,
        supabaseUrl: supabaseUrl ? '✓ Set' : '✗ Missing',
        supabaseAnonKey: supabaseAnonKey ? '✓ Set' : '✗ Missing',
        serviceRoleKey: serviceRoleKey ? '✓ Set' : '✗ Missing',
        message: 'All env vars present' as string,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
