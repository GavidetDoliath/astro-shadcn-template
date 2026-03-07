import type { APIRoute } from 'astro';
import { getServerSupabase } from '@/lib/supabase';
import { getApiUser, hasRole } from '@/lib/auth';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), { status: 400 });
    }

    // Verify authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin', 'redacteur')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as Record<string, any>;

    const supabase = getServerSupabase();

    // For redacteur: verify ownership
    if (user.role === 'redacteur') {
      const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', id)
        .single();

      if (!article || article.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden: you can only edit your own articles' }), {
          status: 403,
        });
      }
    }

    const { data, error } = await supabase
      .from('articles')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error (PUT article):', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Article PUT error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), { status: 400 });
    }

    // Verify authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin', 'redacteur')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = getServerSupabase();

    // For redacteur: verify ownership
    if (user.role === 'redacteur') {
      const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', id)
        .single();

      if (!article || article.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden: you can only delete your own articles' }), {
          status: 403,
        });
      }
    }

    const { error } = await supabase.from('articles').delete().eq('id', id);

    if (error) {
      console.error('Supabase error (DELETE article):', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Article DELETE error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
