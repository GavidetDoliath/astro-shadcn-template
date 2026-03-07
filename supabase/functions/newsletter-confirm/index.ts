import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  // Only GET allowed
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get token from URL query params
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find subscription by token
    const { data: subscription, error: queryError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (queryError || !subscription) {
      return new Response(JSON.stringify({ error: 'Token not found' }), { status: 404 });
    }

    // Check if token is expired
    const expiresAt = new Date(subscription.token_expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired. Please subscribe again.' }),
        { status: 410 }
      );
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
      console.error('Failed to confirm subscription:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to confirm subscription' }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email confirmed successfully!',
        email: subscription.email,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Newsletter confirm error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
