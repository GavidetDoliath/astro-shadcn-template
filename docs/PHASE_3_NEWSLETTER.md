# Phase 3: Newsletter Implementation

## Overview

Phase 3 implements a newsletter subscription system with email confirmation (double opt-in). This is a public-facing feature that allows readers to subscribe via email without needing an account.

## Features

✓ Email subscription with validation
✓ Double opt-in (confirmation email required)
✓ 24-hour confirmation token expiry
✓ Email sending via Resend.com
✓ Unsubscribe support (GDPR/CAN-SPAM compliant)
✓ Newsletter page and confirmation page

## Files Created

### API Routes
- `src/pages/api/newsletter/subscribe.ts` — POST to subscribe
- `src/pages/api/newsletter/confirm.ts` — GET to confirm subscription
- `src/pages/api/newsletter/unsubscribe.ts` — POST to unsubscribe

### Components
- `src/components/auth/NewsletterForm.tsx` — Reusable email subscription form (React)

### Pages
- `src/pages/newsletter.astro` — Public newsletter landing page
- `src/pages/newsletter-confirm.astro` — Confirmation result page

## Setup Instructions

### 1. Update Environment Variables

Add to your `.env` file:

```env
# Get from https://resend.com (free tier available)
RESEND_API_KEY=re_your-api-key-here
FROM_EMAIL=noreply@example.com
SITE_URL=https://example.com
```

Make sure `SUPABASE_SERVICE_ROLE_KEY` is also set (from Phase 1/Phase 2).

### 2. Database Prerequisites

Ensure the `newsletter_subscriptions` table exists (from Phase 1 SQL):

```
Table: newsletter_subscriptions
Columns:
  - id (UUID, primary key)
  - email (TEXT, unique)
  - status (enum: pending | confirmed | unsubscribed)
  - confirmation_token (TEXT, unique, nullable)
  - token_expires_at (TIMESTAMPTZ, nullable)
  - source (TEXT, default: 'website')
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

### 3. Get Resend API Key

1. Go to https://resend.com and sign up (free)
2. Create an API key
3. Add it to `.env` as `RESEND_API_KEY`
4. Set `FROM_EMAIL` to your verified domain email (e.g., `noreply@laderaison.fr`)

## Usage

### Add Newsletter Form to Your Pages

The `NewsletterForm` component is reusable React component. Add it anywhere:

```astro
---
// src/pages/some-page.astro
import { NewsletterForm } from '@/components/auth/NewsletterForm';
---

<Layout>
  <NewsletterForm client:load />
</Layout>
```

#### Props

```typescript
interface NewsletterFormProps {
  onSuccess?: (email: string) => void;  // Callback when subscription succeeds
  className?: string;                    // CSS classes
  buttonVariant?: 'default' | 'outline' | 'ghost';  // Button style
}
```

### Subscribe Flow

1. User enters email → clicks "S'abonner"
2. POST `/api/newsletter/subscribe` validates and stores email (status: pending)
3. Resend sends confirmation email with unique token
4. User clicks link in email → GET `/api/newsletter/confirm?token=...`
5. Link redirects to `/newsletter-confirm` which confirms subscription

### Unsubscribe Flow

Option A: Include unsubscribe link in emails:
```
https://example.com/api/newsletter/unsubscribe
  ?email=user@example.com
```

Option B: Call API directly:
```javascript
POST /api/newsletter/unsubscribe
{
  "email": "user@example.com"
  // OR "token": "confirmation-token"
}
```

## API Endpoints

### POST /api/newsletter/subscribe

Subscribe an email to the newsletter.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (201 Success):**
```json
{
  "message": "Subscription pending. Check your email for confirmation link.",
  "status": "pending"
}
```

**Response (200 Already Confirmed):**
```json
{
  "message": "Already subscribed",
  "status": "confirmed"
}
```

**Response (400 Invalid):**
```json
{
  "error": "Valid email is required"
}
```

---

### GET /api/newsletter/confirm?token=...

Confirm a newsletter subscription via token from email link.

**Response (200 Success):**
```json
{
  "message": "Email confirmed successfully!",
  "email": "user@example.com",
  "status": "confirmed"
}
```

**Response (404 Invalid Token):**
```json
{
  "error": "Invalid or expired confirmation token"
}
```

**Response (410 Expired):**
```json
{
  "error": "Confirmation token has expired. Please subscribe again."
}
```

---

### POST /api/newsletter/unsubscribe

Unsubscribe an email from the newsletter.

**Request (by email):**
```json
{
  "email": "user@example.com"
}
```

**Request (by token):**
```json
{
  "token": "confirmation-token"
}
```

**Response (200 Success):**
```json
{
  "message": "Successfully unsubscribed"
}
```

## Email Templates

The confirmation email is sent via Resend with:
- Subject: "Confirmez votre abonnement à La Déraison"
- HTML template with clickable button
- Link valid for 24 hours
- Unsubscribe information in footer

Customize the email template in `src/pages/api/newsletter/subscribe.ts` (search for `emailHtml`).

## Testing

### Test Locally

1. Start dev server: `pnpm dev`
2. Visit http://localhost:4000/newsletter
3. Enter a test email
4. Check console logs for the confirmation URL (since Resend won't send in dev without API key)
5. Visit the confirmation URL to test: `http://localhost:4000/api/newsletter/confirm?token=...`

### With Resend

1. Set up Resend API key in `.env`
2. Subscribe with a real email
3. Check inbox for confirmation email
4. Click the link to confirm

### Database Verification

Check Supabase dashboard:
```sql
SELECT email, status, created_at FROM newsletter_subscriptions ORDER BY created_at DESC;
```

## Next Steps

- **Phase 4**: Subscriber authentication (create accounts for newsletter subscribers)
- **Phase 5**: Content gating (show "subscribe" overlay for locked articles)
- **Phase 7**: Stripe integration (paid subscriptions)

## Troubleshooting

### Email not sending
- Check `RESEND_API_KEY` is set in `.env`
- Verify `FROM_EMAIL` is verified in Resend dashboard
- Check console logs for Resend API errors

### Confirmation token not working
- Verify token hasn't expired (24 hour limit)
- Check `newsletter_subscriptions` table in Supabase
- Ensure `confirmation_token` matches the URL parameter

### CORS issues
- Newsletter API routes are public, no auth required
- Should work from any origin
- Check browser console for actual error details

## Security Notes

✓ Tokens are 32 random hex bytes (cryptographically secure)
✓ Tokens expire after 24 hours
✓ Emails are normalized (lowercased, trimmed)
✓ No user data is sent in response beyond what's necessary
✓ Email sending failures don't block subscription (graceful fallback)
