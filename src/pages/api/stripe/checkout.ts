import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getApiUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const priceId = import.meta.env.STRIPE_PRICE_ID || '';
const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4000';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate user
    const user = await getApiUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'STRIPE_PRICE_ID not configured' }), { status: 500 });
    }

    const supabase = getServerSupabase();

    // Get or create Stripe customer
    let customerId: string;
    const { data: profileData } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

    if (profileData?.stripe_customer_id) {
      customerId = profileData.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Save to profile
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/compte/abonnement?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/abonnement`,
      metadata: { userId: user.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
