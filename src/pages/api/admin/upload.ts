import type { APIRoute } from 'astro';
import { extractAccessToken } from '@/lib/auth';
import { getAuthedSupabase } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const token = extractAccessToken(request)!;
  const supabase = getAuthedSupabase(token);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'Aucun fichier reçu' }), { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const { data } = supabase.storage.from('article-images').getPublicUrl(filename);

  return new Response(JSON.stringify({ url: data.publicUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
