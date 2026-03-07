# Phase 7: Stripe Integration & Payments

## Overview

Phase 7 implements Stripe payment integration to monetize premium content. Subscribers can purchase monthly subscriptions, manage their billing, and access exclusive content based on their payment status.

## Features

✓ Stripe Checkout for one-time or recurring payments
✓ Webhook handling for payment events
✓ Subscription management via Stripe Customer Portal
✓ Automatic role updates (free → paid → free)
✓ Premium pricing page
✓ Subscription management dashboard
✓ Secure token handling

## Files Created/Modified

### API Routes
- `src/pages/api/stripe/create-checkout.ts` — POST to create Checkout session (NEW)
- `src/pages/api/stripe/webhook.ts` — POST webhook handler (NEW)
- `src/pages/api/stripe/portal.ts` — POST to open Customer Portal (NEW)

### Pages
- `src/pages/abonnement.astro` — Public pricing/subscription page (NEW)
- `src/pages/compte/abonnement.astro` — User subscription management (NEW)
- `.env.example` — Updated with Stripe env vars (MODIFIED)

## Setup Instructions

### 1. Create Stripe Account

1. Go to https://stripe.com
2. Sign up and verify your account
3. Go to Dashboard → Settings → API Keys
4. Copy your keys:
   - **Secret Key** (`sk_live_...` or `sk_test_...`)
   - **Publishable Key** (`pk_live_...` or `pk_test_...`)

### 2. Create Stripe Price

1. Go to Dashboard → Products
2. Create a new product:
   - Name: "Premium Subscription"
   - Description: "Monthly premium access"
3. Create a price:
   - Amount: 500 (cents = $5.00)
   - Billing period: Monthly
   - Copy the **Price ID** (`price_...`)

### 3. Set Environment Variables

Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_PRICE_ID=price_your-price-id
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
```

Leave `STRIPE_WEBHOOK_SECRET` empty for now (will set up after webhook creation).

### 4. Configure Webhook Endpoint

**In development (testing):**
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:4000/api/stripe/webhook`
3. Copy the **Webhook Signing Secret** (`whsec_...`) from the output
4. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

**In production:**
1. Go to Dashboard → Webhooks
2. Create endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: Select all `customer.subscription.*` and `invoice.payment_*` events
3. Copy signing secret and add to `.env`

### 5. Test Payment Flow

1. Start dev server: `pnpm dev`
2. Visit http://localhost:4000/abonnement
3. Login or create account
4. Click "S'abonner pour 5€/mois"
5. Use Stripe test card: `4242 4242 4242 4242` (exp: 12/34, CVC: 123)
6. Check http://localhost:4000/compte/abonnement for status

## Payment Flow

```
User visits /abonnement
  ↓
Not authenticated → Redirect to /inscription
  ↓
Authenticated, not paid → Click "S'abonner"
  ↓
POST /api/stripe/create-checkout
  → Create/fetch Stripe customer
  → Create Checkout session
  → Return Stripe URL
  ↓
Redirect to Stripe Checkout
  ↓
User enters payment info (test card)
  ↓
Stripe processes payment
  ↓
Stripe redirects to /compte/abonnement?success=true
  ↓
Stripe webhook sent to /api/stripe/webhook
  → Verify signature
  → Update profiles table (role → subscriber_paid)
  ↓
User now has premium access
```

## Webhook Events Handled

### checkout.session.completed
- Customer completed Stripe Checkout
- Sets: `stripe_customer_id`, `stripe_subscription_id`, `role = subscriber_paid`

### customer.subscription.updated
- Subscription status changed (renewal, pause, etc.)
- Updates: `stripe_subscription_status`, `subscription_current_period_end`

### customer.subscription.deleted
- User cancelled subscription
- Updates: `role = subscriber_free`, clears subscription fields

### invoice.payment_failed
- Payment failed (retry grace period)
- Sets: `stripe_subscription_status = past_due`

## API Endpoints

### POST /api/stripe/create-checkout

Create a Stripe Checkout session.

**Authentication:** User must be logged in

**Request:**
```
POST /api/stripe/create-checkout
```

**Response (200):**
```json
{
  "url": "https://checkout.stripe.com/pay/..."
}
```

**Errors:**
- `401` — Not authenticated
- `404` — Stripe not configured
- `500` — Failed to create session

---

### POST /api/stripe/webhook

Handle Stripe webhook events.

**Authentication:** Webhook signature verification (Stripe only)

**Request Headers:**
- `stripe-signature` — Webhook signature (required)

**Supports Events:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Response (200):**
```json
{
  "received": true
}
```

---

### POST /api/stripe/portal

Open Stripe Customer Portal for subscription management.

**Authentication:** User must be logged in and have a subscription

**Request:**
```
POST /api/stripe/portal
```

**Response (200):**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Errors:**
- `401` — Not authenticated
- `404` — No subscription found
- `500` — Failed to create portal session

## Database Schema

The `profiles` table has Stripe fields:

```sql
ALTER TABLE profiles ADD COLUMN (
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_subscription_status TEXT,
  subscription_current_period_end TIMESTAMPTZ
);
```

**Fields:**
- `stripe_customer_id` — Stripe Customer ID
- `stripe_subscription_id` — Stripe Subscription ID
- `stripe_subscription_status` — "active", "past_due", "canceled", "trialing"
- `subscription_current_period_end` — Next renewal date

## Subscription Statuses

| Status | Meaning | Role | Notes |
|--------|---------|------|-------|
| `active` | Current subscription | `subscriber_paid` | Access premium |
| `past_due` | Payment failed | `subscriber_paid` | Grace period, retry in progress |
| `trialing` | Trial period | `subscriber_paid` | Free access during trial |
| `canceled` | Cancelled | `subscriber_free` | Downgraded automatically |
| NULL | Never subscribed | `subscriber_free` | No subscription |

## Pages

### /abonnement (Public Pricing Page)

**Shows:**
- Free vs Premium comparison
- Features list
- Pricing ($5/month)
- FAQ
- CTA buttons

**CTA Buttons:**
- Anonymous: "S'inscrire"
- Free subscriber: "S'abonner pour 5€/mois"
- Paid subscriber: "Merci d'être premium!"

### /compte/abonnement (Subscription Management)

**Shows:**
- Current subscription status
- Plan name and price
- Next renewal date
- Subscription state (active, past_due, etc.)
- Features list

**Actions:**
- Free tier: Link to /abonnement
- Paid tier: "Gérer mon abonnement" button (opens Stripe Portal)

**Stripe Portal Allows:**
- View invoice history
- Change payment method
- Cancel subscription
- Update billing address

## Testing

### With Stripe Test Cards

Use these card numbers in Stripe's test mode:

```
Success:         4242 4242 4242 4242
Decline:         4000 0000 0000 0002
Require auth:    4000 0025 0000 3155
Expired:         4000 0000 0000 0069
```

Exp/CVC: Any future date + any 3 digits

### Testing Webhook Locally

Use Stripe CLI:

```bash
# Terminal 1: Start Stripe forwarding
stripe listen --forward-to localhost:4000/api/stripe/webhook

# Terminal 2: Trigger test event
stripe trigger checkout.session.completed
```

### Test Subscription Flow

1. Login as test user
2. Go to /abonnement
3. Click "S'abonner"
4. Enter test card `4242 4242 4242 4242`
5. Complete checkout
6. Check `/compte/abonnement` → should show "Abonné Premium"
7. Check Supabase → `profiles` row should have `role = subscriber_paid`

## Security Considerations

✓ **Webhook Verification** — Signature validated against `STRIPE_WEBHOOK_SECRET`
✓ **Auth Required** — Checkout and Portal endpoints require login
✓ **HTTPS Only** — Stripe rejects non-HTTPS webhook URLs in production
✓ **Idempotency** — Webhook events are retried; logic handles duplicates gracefully
✓ **No Keys in Logs** — Secret key never logged or exposed
✓ **Server-Side Processing** — All Stripe operations run on server, never client

## Error Handling

### Missing Configuration
```
⚠️  "Stripe secret key not configured"
→ Add STRIPE_SECRET_KEY to .env
```

### Webhook Signature Failure
```
❌ "Webhook signature verification failed"
→ Check STRIPE_WEBHOOK_SECRET matches Stripe dashboard
```

### Customer Not Found
```
⚠️  "User not found for email"
→ Webhook received but user doesn't exist in Supabase
→ Check email matches between Stripe and auth.users
```

## Integration Points

### Content Gating (Phase 5)
- Article access based on `subscriber_paid` role
- Gated articles show AccessGate overlay to non-premium users

### User Management (Phase 6)
- Admins can manually set users to `subscriber_paid`
- Stripe updates happen via webhooks automatically

### Newsletter (Phase 3)
- Upsell premium in confirmation email
- Link to /abonnement from newsletter footer

## Monitoring

### Check Payment Status
```sql
SELECT
  email,
  role,
  stripe_customer_id,
  stripe_subscription_status,
  subscription_current_period_end
FROM profiles
WHERE stripe_customer_id IS NOT NULL
ORDER BY subscription_current_period_end DESC;
```

### Failed Payments
```sql
-- Users with past_due subscriptions
SELECT email, stripe_subscription_status
FROM profiles
WHERE stripe_subscription_status = 'past_due';
```

### Recent Subscriptions
```sql
-- New subscribers (last 7 days)
SELECT email, created_at
FROM profiles
WHERE role = 'subscriber_paid'
AND created_at > NOW() - INTERVAL '7 days';
```

## Troubleshooting

### Webhook not received
1. Check STRIPE_WEBHOOK_SECRET is set
2. Verify endpoint URL is correct (public, HTTPS in prod)
3. Check Stripe logs → Events for delivery status
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### User not upgraded after payment
1. Check webhook was received (Stripe dashboard)
2. Verify signature validation passed (check logs)
3. Check profiles table for user record
4. Manually update: `UPDATE profiles SET role = 'subscriber_paid' WHERE id = '...'`

### Customer Portal returns error
1. Verify user has `stripe_customer_id` in profiles
2. Check customer exists in Stripe dashboard
3. Ensure correct publishable key in frontend

## Limitations & Future Features

### Current Limitations
- No yearly billing option
- No promo codes
- No trial period
- Fixed price ($5/month)

### Future Enhancements
- [ ] Yearly plan option (10% discount)
- [ ] Promo code support
- [ ] Free trial (7-14 days)
- [ ] Multiple tiers (Standard, Premium, VIP)
- [ ] Usage-based billing
- [ ] Dunning (retry payment failures)
- [ ] Subscription pause
- [ ] Referral rewards
- [ ] Partner plans

## Related Phases

- **Phase 5** — Content gating (uses subscriber_paid role)
- **Phase 6** — User management (admin can set subscription)
- **Phase 4** — Auth (creates accounts for payment)

## Next Steps

With Phase 7 complete, the journal is fully monetized:
1. Newsletter sign-ups (Phase 3)
2. Free accounts (Phase 4)
3. Content gating (Phase 5)
4. User management (Phase 6)
5. **Stripe payments (Phase 7)** ✓

All systems working together to:
- Convert readers to subscribers
- Monetize premium content
- Manage subscription lifecycle
- Provide sustainable revenue model
