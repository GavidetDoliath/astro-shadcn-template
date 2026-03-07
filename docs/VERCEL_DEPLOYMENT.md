# Vercel Deployment Guide

This project is configured for Vercel serverless functions with on-demand server rendering.

## Architecture

- **Adapter**: `@astrojs/vercel` (replaces Node.js standalone)
- **Output mode**: `server` (on-demand rendering)
- **Functions**: All pages and API routes run as Vercel serverless functions
- **Database**: Supabase (accessed from serverless context)

## Setup Steps

### 1. Create Vercel Project

```bash
# Link to Vercel
pnpm vercel link

# Or create via dashboard: https://vercel.com/dashboard
```

### 2. Set Environment Variables in Vercel

Go to your project settings → Environment Variables and add:

**Supabase:**
```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Newsletter (Resend):**
```
RESEND_API_KEY=re_your-api-key
FROM_EMAIL=bonjour@laderaison.fr
SITE_URL=https://yourdomain.com
```

**Stripe:**
```
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID=price_your-price-id
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
```

### 3. Deploy

```bash
# Deploy to Vercel
pnpm vercel deploy --prod

# Or use git push (if connected)
git push origin main
```

## Important Notes

### No `.env` in Production

- `.env` file is **only for local development**
- `.env` is git-ignored and NOT deployed to Vercel
- All secrets are configured in Vercel dashboard
- Production uses Vercel environment variables

### Serverless Function Limits

- **Cold start**: ~1-2 seconds (first request)
- **Timeout**: 60 seconds (standard), 300s (Pro)
- **Max bundle size**: 250MB uncompressed

### Node.js Version

- **Local**: Node 25 (via Volta)
- **Vercel**: Node 24 (automatic)
- To pin a specific version, create `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "env": {
    "NODE_VERSION": "24.x"
  }
}
```

## Webhook Configuration

### Stripe Webhook

The webhook endpoint is automatically:
```
https://yourdomain.com/api/stripe/webhook
```

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add Endpoint: `https://yourdomain.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
4. Copy webhook signing secret → Set `STRIPE_WEBHOOK_SECRET` in Vercel

### Testing Locally

Use Stripe CLI to test webhooks during development:
```bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

## Monitoring

### Vercel Analytics

- **Automatic**: Monitors Web Vitals, CLS, FCP, LCP
- **View**: Vercel Dashboard → Analytics

### Environment Variables

**Check which env vars are set:**
```bash
pnpm vercel env list
```

**Update single var:**
```bash
pnpm vercel env set STRIPE_SECRET_KEY "sk_live_..."
pnpm vercel deploy --prod
```

## Troubleshooting

### 502 Bad Gateway

Usually means function error. Check:
```bash
pnpm vercel logs --tail
```

### Cold Start Too Slow

- Expected for serverless (1-2 seconds)
- Use Vercel Cron or scheduled functions to keep warm
- Consider upgrading to Vercel Pro for performance

### Webhook Not Received

1. Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel (not localhost)
2. Check Stripe Dashboard → Events for delivery status
3. Look at Vercel function logs: `pnpm vercel logs --tail`

## Security Best Practices

✓ **Environment Variables**
- All secrets in Vercel, not `.env`
- Use `PUBLIC_*` only for client-side safe values
- Sensitive keys (STRIPE_SECRET_KEY, SERVICE_ROLE) are server-only

✓ **API Routes**
- Authenticate via `getApiUser()` in each route
- Verify webhook signatures (Stripe)
- Use RLS policies in Supabase

✓ **Middleware**
- Validates JWT tokens from cookies
- Attaches user to `context.locals.user`
- Protects `/admin/*` and `/compte/*` routes

## Migration from Node to Vercel

If you were previously using Node standalone:

1. **Remove Node adapter**: `pnpm remove @astrojs/node`
2. **Install Vercel**: `pnpm add @astrojs/vercel`
3. **Update config**: Change `adapter: node()` → `adapter: vercel()`
4. **Set output mode**: Add `output: 'server'` to config
5. **Move secrets**: From `.env` → Vercel environment variables
6. **Deploy**: `pnpm vercel deploy --prod`

## Performance Tips

**Optimize Function Bundle:**
- Minimize dependencies in API routes
- Use dynamic imports for heavy libraries
- Lazy-load components when possible

**Database Queries:**
- Use indexes on frequently queried columns
- Cache results in Vercel KV (if needed)
- Limit query result size

**Static Content:**
- SVGs and images use CDN automatically
- Configure ISR (Incremental Static Regeneration) if needed
- Use `vercelToolbar: false` in Astro config for production

## Related Documentation

- [Vercel Astro Adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
