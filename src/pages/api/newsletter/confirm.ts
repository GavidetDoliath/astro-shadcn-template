import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ url }) => {
  try {
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Confirmation token is required' }),
        { status: 400 }
      );
    }

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find subscription by token
    const { data: subscription, error: selectError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, status, token_expires_at')
      .eq('confirmation_token', token)
      .single();

    if (selectError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired confirmation token' }),
        { status: 404 }
      );
    }

    // Check if token is expired
    if (subscription.token_expires_at && new Date(subscription.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Confirmation token has expired. Please subscribe again.' }),
        { status: 410 }
      );
    }

    // Check if already confirmed
    if (subscription.status === 'confirmed') {
      return new Response(
        JSON.stringify({ message: 'Email already confirmed', status: 'confirmed' }),
        { status: 200 }
      );
    }

    // Update subscription status to confirmed
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'confirmed',
        subscribed_at: new Date().toISOString(),
        confirmation_token: null,
        token_expires_at: null,
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Newsletter confirm error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to confirm subscription' }),
        { status: 500 }
      );
    }

    // Return success response
    // In real app, would redirect to a success page
    return new Response(
      JSON.stringify({
        message: 'Email confirmed successfully!',
        email: subscription.email,
        status: 'confirmed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Newsletter confirm error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
