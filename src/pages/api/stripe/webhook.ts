import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
      });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
        status: 400,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!customerId) {
          console.warn('Checkout session completed without customer ID');
          break;
        }

        // Get customer email to find user
        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = (customer as Stripe.Customer).email;

        if (!customerEmail) {
          console.error('Customer has no email:', customerId);
          break;
        }

        // Find user by email
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError || !users) {
          console.error('Failed to list users:', usersError);
          break;
        }

        const user = users.find(u => u.email === customerEmail);

        if (!user) {
          console.error('User not found for email:', customerEmail);
          break;
        }

        // Update profile with subscription info
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: 'active',
            role: 'subscriber_paid',
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to update profile:', updateError);
          break;
        }

        console.log('Checkout completed for user:', user.email);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError || !profile) {
          console.warn('Profile not found for customer:', customerId);
          break;
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: new Date(
              (subscription as any).current_period_end * 1000,
            ).toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Failed to update subscription status:', updateError);
          break;
        }

        console.log('Subscription updated for customer:', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError || !profile) {
          console.warn('Profile not found for customer:', customerId);
          break;
        }

        // Downgrade to free subscriber
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_subscription_status: null,
            stripe_subscription_id: null,
            role: 'subscriber_free',
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Failed to downgrade user:', updateError);
          break;
        }

        console.log('Subscription cancelled for customer:', customerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by stripe_customer_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError || !profile) {
          console.warn('Profile not found for customer:', customerId);
          break;
        }

        // Mark as past_due (grace period, Stripe will retry)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_subscription_status: 'past_due',
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Failed to update payment status:', updateError);
          break;
        }

        console.log('Payment failed for customer:', customerId);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
