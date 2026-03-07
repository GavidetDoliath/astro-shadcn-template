# Supabase Edge Functions Setup

This project uses **Supabase Edge Functions** for all sensitive backend operations: Stripe payments, webhook handling, and newsletter management. Secrets are stored securely in Supabase's secret manager.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Astro Frontend (Vercel/Node.js)                        │
│ - Static/prerendered pages                             │
│ - Client-side forms & interactions                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─── Calls Edge Functions with Bearer token
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Supabase Edge Functions (Deno Runtime)                 │
│ ├─ /stripe-webhook    (Stripe events)                  │
│ ├─ /stripe-checkout   (Create checkout session)        │
│ ├─ /stripe-portal     (Customer portal)                │
│ ├─ /newsletter-subscribe  (Double opt-in)             │
│ ├─ /newsletter-confirm    (Email confirmation)        │
│ └─ /newsletter-unsubscribe (GDPR compliance)          │
│                                                        │
│ Secrets stored in Supabase Secret Manager:            │
│ - STRIPE_SECRET_KEY                                    │
│ - STRIPE_WEBHOOK_SECRET                               │
│ - STRIPE_PRICE_ID                                     │
│ - RESEND_API_KEY                                      │
│ - FROM_EMAIL                                          │
│ - SUPABASE_URL (passed as env)                        │
│ - SUPABASE_SERVICE_ROLE_KEY                          │
│ - SITE_URL                                            │
└─────────────────────────────────────────────────────────┘
                 ↑
                 └─── Reads/writes to Supabase tables
```

## Setup Instructions

### 1. Install Supabase CLI

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Or download from https://github.com/supabase/cli/releases
```

### 2. Link to Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

You'll need:
- **Project Ref**: From https://app.supabase.com → Settings → General
- **Database Password**: Created during project setup

### 3. Set Secrets in Supabase

Go to **https://app.supabase.com** → Project Settings → Secrets

Add these secrets:

```
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID=price_your-price-id
RESEND_API_KEY=re_your-api-key
FROM_EMAIL=bonjour@laderaison.fr
SITE_URL=https://yourdomain.com
```

**In development:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase CLI
- No need to set them manually

### 4. Test Locally

```bash
# Start Supabase locally
supabase start

# In another terminal, test a function
curl -i \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  http://localhost:54321/functions/v1/newsletter-subscribe
```

### 5. Deploy to Production

```bash
# Push secrets to production
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_ID=price_... \
  RESEND_API_KEY=re_... \
  FROM_EMAIL=bonjour@laderaison.fr \
  SITE_URL=https://yourdomain.com

# Deploy functions
supabase functions deploy
```

## Edge Function Details

### stripe-webhook
- **Method**: POST
- **Auth**: Stripe signature verification (not user auth)
- **Purpose**: Handle Stripe webhook events
- **Events**:
  - `checkout.session.completed` → Create subscription
  - `customer.subscription.updated` → Update status
  - `customer.subscription.deleted` → Downgrade to free
  - `invoice.payment_failed` → Mark as past_due

### stripe-checkout
- **Method**: POST
- **Auth**: Bearer token (access token from Supabase Auth)
- **Body**: (empty, uses auth header)
- **Returns**: `{ url: "https://checkout.stripe.com/..." }`
- **Purpose**: Create Checkout session for new subscription

### stripe-portal
- **Method**: POST
- **Auth**: Bearer token (access token from Supabase Auth)
- **Body**: (empty, uses auth header)
- **Returns**: `{ url: "https://billing.stripe.com/..." }`
- **Purpose**: Open Stripe customer portal for account management

### newsletter-subscribe
- **Method**: POST
- **Auth**: None (public)
- **Body**: `{ "email": "user@example.com" }`
- **Returns**: `{ success: true, message: "Check your email..." }`
- **Purpose**: Subscribe email to newsletter (sends confirmation)

### newsletter-confirm
- **Method**: GET
- **Auth**: None (token in URL)
- **Query**: `?token=...` (from email link)
- **Returns**: `{ success: true, email: "...", message: "..." }`
- **Purpose**: Confirm email subscription

### newsletter-unsubscribe
- **Method**: POST or GET
- **Auth**: None (token or email)
- **Body/Query**: `email=...` OR `token=...`
- **Returns**: `{ success: true, email: "..." }`
- **Purpose**: Unsubscribe email (GDPR/CAN-SPAM compliance)

## Calling Edge Functions from Astro

### From Server-side (Astro components, API routes)

```typescript
// Get access token from cookies
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/stripe-checkout',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
);

const { url } = await response.json();
```

### From Client-side (React, JavaScript)

```typescript
// Get current user's access token from Supabase client
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  'https://your-project.supabase.co/functions/v1/newsletter-subscribe',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  }
);
```

## Environment Variables

**Local Development** (`.env`):
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Production**:
- Secrets set via `supabase secrets set` (never in .env)
- Public URL: `https://your-project.supabase.co/functions/v1/...`
- Functions auto-receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Monitoring & Logs

### View Function Logs

```bash
# Local
supabase functions list

# Production
supabase functions list --linked

# Follow logs
supabase functions logs stripe-webhook --follow
```

### Check Secrets

```bash
# List all secrets
supabase secrets list

# Check a specific secret (masked)
supabase secrets list | grep STRIPE
```

## Troubleshooting

### Function not deployed

```bash
# Check status
supabase functions list

# Redeploy specific function
supabase functions deploy stripe-webhook

# Full redeploy
supabase functions deploy
```

### Secrets not accessible

```bash
# Verify secrets are set
supabase secrets list

# Set missing secret
supabase secrets set STRIPE_SECRET_KEY=sk_live_...

# Redeploy function (picks up new secrets)
supabase functions deploy
```

### Function timeout (>600 seconds)

- Increase timeout in `supabase/config.toml`: `timeout_sec = 600`
- Consider splitting into multiple smaller functions
- Optimize Stripe API calls

### CORS errors

- Edge Functions allow cross-origin by default
- If issues persist, check function response headers

## Security Best Practices

✓ **Secrets Management**
- All API keys in Supabase Secret Manager (never in code/git)
- Environment-specific secrets (test vs. production)
- Automatic secret rotation support

✓ **Authentication**
- Stripe: Signature verification (webhook only)
- User operations: Bearer token validation with Supabase Auth
- Newsletter: No auth (public endpoints)

✓ **HTTPS Only**
- All production Edge Functions endpoints use HTTPS
- Stripe rejects non-HTTPS webhooks in production

✓ **Input Validation**
- Check required parameters (email, token, etc.)
- Validate token expiration
- Verify webhook signatures before processing

## Related Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://docs.deno.com)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Resend API](https://resend.com/docs)

## Deployment Checklist

- [ ] Supabase project created and linked
- [ ] All secrets added to Supabase Secret Manager
- [ ] Edge Functions deployed: `supabase functions deploy`
- [ ] Stripe webhook URL updated to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- [ ] Stripe webhook secret copied to Supabase
- [ ] Test functions locally: `supabase start` + curl requests
- [ ] Verify logs: `supabase functions logs <function> --follow`
- [ ] Update Astro `.env.example` with Edge Function URLs
- [ ] Test payment flow: signup → checkout → confirm
- [ ] Test newsletter: subscribe → confirm → unsubscribe
