import type { APIRoute } from 'astro';
import { getServerSupabase } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400 });
    }

    const supabase = getServerSupabase();

    // Find subscription by token
    const { data: subscription, error: queryError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (queryError || !subscription) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 404 });
    }

    // Check if token has expired
    if (subscription.token_expires_at && new Date(subscription.token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Token has expired' }), { status: 400 });
    }

    // Update status to confirmed
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'confirmed',
        confirmation_token: null,
        token_expires_at: null,
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Database error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to confirm subscription' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Email confirmed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter confirm error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
