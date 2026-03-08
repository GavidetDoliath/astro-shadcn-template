import type { APIRoute } from 'astro';
import { extractAccessToken } from '@/lib/auth';
import { getAuthedSupabase } from '@/lib/supabase';

export const prerender = false;

export const PUT: APIRoute = async ({ request, params }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const token = extractAccessToken(request)!;
  const supabase = getAuthedSupabase(token);

  // Map form fields to DB column names (linkedinUrl → linkedinurl, accessLevel → access_level)
  const { title, excerpt, content, date, category, image, slug, author, linkedinUrl, featured, published, accessLevel } = body;
  const row: Record<string, unknown> = {
    title, excerpt, content, date, category, image, slug, author, featured, published,
    linkedinurl: linkedinUrl,
    access_level: accessLevel ?? 'public',
  };

  const { data, error } = await supabase
    .from('articles')
    .update(row)
    .eq('id', params.id!)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const token = extractAccessToken(request)!;
  const supabase = getAuthedSupabase(token);

  const { error } = await supabase.from('articles').delete().eq('id', params.id!);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
