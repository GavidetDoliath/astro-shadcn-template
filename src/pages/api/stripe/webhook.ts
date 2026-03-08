import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getServerSupabase } from '@/lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
      });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify Stripe signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Stripe signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }

    const supabase = getServerSupabase();

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.userId) {
          // Update profile with subscription info
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              stripe_subscription_status: 'active',
              role: 'subscriber_paid',
            })
            .eq('id', session.metadata.userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by stripe_customer_id
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (profiles) {
          const periodEnd =
            typeof (subscription as unknown as Record<string, unknown>).current_period_end === 'number'
              ? new Date(
                  ((subscription as unknown as Record<string, unknown>).current_period_end as number) * 1000
                ).toISOString()
              : null;

          await supabase
            .from('profiles')
            .update({
              stripe_subscription_status: subscription.status,
              ...(periodEnd && { subscription_current_period_end: periodEnd }),
            })
            .eq('id', profiles.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by stripe_customer_id
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (profiles) {
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_status: 'canceled',
              stripe_subscription_id: null,
              role: 'subscriber_free',
            })
            .eq('id', profiles.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // Find user by stripe_customer_id
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single();

        if (profiles) {
          await supabase
            .from('profiles')
            .update({ stripe_subscription_status: 'past_due' })
            .eq('id', profiles.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
