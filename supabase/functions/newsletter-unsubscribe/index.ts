import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  // Only POST or GET allowed
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    let email: string | null = null;
    let token: string | null = null;

    if (req.method === 'POST') {
      const { email: bodyEmail, token: bodyToken } = await req.json() as {
        email?: string;
        token?: string;
      };
      email = bodyEmail || null;
      token = bodyToken || null;
    } else {
      // GET method
      const url = new URL(req.url);
      email = url.searchParams.get('email');
      token = url.searchParams.get('token');
    }

    if (!email && !token) {
      return new Response(
        JSON.stringify({ error: 'Either email or token is required' }),
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find subscription by email or token
    let subscription;
    if (email) {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('email', email)
        .single();
      subscription = data;
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    } else if (token) {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('confirmation_token', token)
        .single();
      subscription = data;
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    }

    if (!subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    }

    // Update status to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to unsubscribe:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully unsubscribed',
        email: subscription.email,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
