import type { APIRoute } from 'astro';
import { getServerSupabase } from '@/lib/supabase';
import { getApiUser, hasRole } from '@/lib/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin', 'redacteur')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = getServerSupabase();

    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });
    }

    // For redacteur: only return their own articles
    let query = supabase.from('articles').select('*').order('date', { ascending: false });

    if (user.role === 'redacteur') {
      query = query.eq('author_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error (GET articles):', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Articles GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin', 'redacteur')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as Record<string, any>;

    // Validate required fields
    if (!body.title || !body.slug) {
      return new Response(JSON.stringify({ error: 'Title and slug are required' }), { status: 400 });
    }

    // Redacteur can only author their own articles
    if (user.role === 'redacteur' && body.author_id && body.author_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Redacteur can only author their own articles' }), {
        status: 403,
      });
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          ...body,
          ...(user.role === 'redacteur' && { author_id: user.id }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error (POST articles):', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Articles POST error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
