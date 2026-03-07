import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, any>;

    const { email, token } = body;

    // Accept either email or token
    if (!email && !token) {
      return new Response(
        JSON.stringify({ error: 'Email or token is required' }),
        { status: 400 }
      );
    }

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let query = supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      });

    if (email) {
      query = query.eq('email', email.toLowerCase().trim());
    } else if (token) {
      query = query.eq('confirmation_token', token);
    }

    const { error } = await query;

    if (error) {
      console.error('Newsletter unsubscribe error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to unsubscribe' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Successfully unsubscribed' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
