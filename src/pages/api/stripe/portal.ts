import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getApiUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4000';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate user
    const user = await getApiUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = getServerSupabase();

    // Get Stripe customer ID from profile
    const { data: profileData } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

    if (!profileData?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), { status: 404 });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profileData.stripe_customer_id,
      return_url: `${siteUrl}/compte/abonnement`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stripe portal error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
