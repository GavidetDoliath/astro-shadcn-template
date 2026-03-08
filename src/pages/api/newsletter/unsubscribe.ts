import type { APIRoute } from 'astro';
import { getServerSupabase } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, token } = (await request.json()) as { email?: string; token?: string };

    if (!email && !token) {
      return new Response(
        JSON.stringify({ error: 'Either email or token is required' }),
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    if (email) {
      // Unsubscribe by email
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ status: 'unsubscribed' })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), { status: 500 });
      }
    } else if (token) {
      // Unsubscribe by token (one-click unsubscribe)
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ status: 'unsubscribed' })
        .eq('confirmation_token', token);

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ message: 'Unsubscribed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!email && !token) {
      return new Response(
        JSON.stringify({ error: 'Either email or token is required' }),
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    if (email) {
      // Unsubscribe by email
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ status: 'unsubscribed' })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), { status: 500 });
      }
    } else if (token) {
      // Unsubscribe by token (one-click unsubscribe)
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ status: 'unsubscribed' })
        .eq('confirmation_token', token);

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ message: 'Unsubscribed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
