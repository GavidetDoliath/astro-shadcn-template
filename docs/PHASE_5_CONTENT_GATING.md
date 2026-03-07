# Phase 5: Content Gating & Access Control

## Overview

Phase 5 implements article access control based on subscription level. Articles can be marked as public, subscriber-only (free tier), or premium (paid tier). Unauthorized viewers see a blurred preview with a call-to-action to upgrade.

## Features

✓ Three access levels for articles (public, subscriber_free, subscriber_paid)
✓ Automatic access control on article detail pages
✓ Beautiful access gate overlay with blurred preview
✓ SSR article pages (auth-aware rendering)
✓ Admin interface to set access level per article
✓ Integrates with Phase 4 subscriber authentication

## Files Created/Modified

### Components
- `src/components/auth/AccessGate.astro` — Access gate overlay (NEW)

### Pages
- `src/pages/lettres/[slug].astro` — Updated to SSR with access control (MODIFIED)

### Admin
- `src/components/admin/ArticleForm.tsx` — Added access_level field (MODIFIED)

### Types
- `src/lib/articles.ts` — Updated Article interface (MODIFIED)

## Article Access Levels

### Public (`public`)
- Visible to everyone
- No authentication required
- No overlay

### Subscriber Free (`subscriber_free`)
- Visible to:
  - Logged-in free subscribers
  - Logged-in premium subscribers
  - Admins and redacteurs
- Anonymous users: see blurred preview + CTA to login

### Subscriber Paid (`subscriber_paid`)
- Visible to:
  - Logged-in premium subscribers
  - Admins
- Free subscribers and anonymous: see blurred preview + CTA to upgrade

## How It Works

### Article Detail Page (`/lettres/[slug]`)

1. **Pre-render = false (SSR)**
   - Page renders on-demand, not statically
   - Has access to `Astro.locals.user` (authenticated user)

2. **Access Check**
   ```typescript
   const hasAccess = canAccessArticle(user, article.access_level);
   ```

3. **Conditional Rendering**
   ```astro
   {!hasAccess ? (
     <AccessGate accessLevel={accessLevel} user={user} excerpt={article.excerpt} />
   ) : (
     <div class="article__content" set:html={contentHtml} />
   )}
   ```

### Access Gate Component

When user lacks access:
- Displays blurred excerpt preview
- Shows lock icon (🔒 or ⭐ for premium)
- Explains access level
- Shows appropriate CTA based on user status:
  - Anonymous: "Se connecter ou s'inscrire"
  - Free subscriber viewing premium: "Passer à l'abonnement payant"

## Setup Instructions

### 1. Database Requirements

Ensure articles table has the columns (from Phase 1 SQL):
```sql
ALTER TABLE articles
  ADD COLUMN access_level TEXT NOT NULL DEFAULT 'public'
    CHECK (access_level IN ('public', 'subscriber_free', 'subscriber_paid'));
```

### 2. Environment Variables

No new env vars needed. Uses existing Supabase credentials.

### 3. Set Article Access Levels

In Supabase dashboard, update articles:

```sql
-- Make an article free-tier only
UPDATE articles SET access_level = 'subscriber_free' WHERE slug = 'article-slug';

-- Make an article premium
UPDATE articles SET access_level = 'subscriber_paid' WHERE slug = 'article-slug';
```

Or use admin interface (`/admin` → edit article → select access level).

## Usage

### Admin Interface

1. Go to `/admin` (requires authentication)
2. Click edit article
3. Select "Accès" dropdown:
   - **Public** — visible to everyone
   - **Abonné gratuit** — free tier + paid
   - **Abonné payant** — premium only
4. Save article

### Content Strategy

**Example Setup:**
- Latest articles: `public` (drive traffic)
- Deep-dive analysis: `subscriber_free` (lead generation)
- Exclusive interviews: `subscriber_paid` (premium revenue)

## Access Gate UI

### Components
- Lock/Star icon (based on access level)
- Blurred content preview
- Clear messaging about access requirements
- Contextual CTA button

### Different CTAs

| Scenario | User Status | Message | CTA |
|----------|------------|---------|-----|
| Free article | Anonymous | Login to read | Se connecter |
| Premium article | Anonymous | Subscribe | S'inscrire |
| Premium article | Free sub | Upgrade | Passer payant |
| Free article | Free sub | ✓ Full access | (no gate) |

## API/Database

### Article Type (TypeScript)

```typescript
interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: 'lettre' | 'pamphlet' | 'fosse';
  image: string;
  slug: string;
  author?: string;
  linkedinUrl?: string;
  featured?: boolean;
  published?: boolean;
  access_level?: 'public' | 'subscriber_free' | 'subscriber_paid'; // NEW
  author_id?: string;
  content?: string;
}
```

### Access Check Helper

```typescript
// From src/lib/auth.ts
canAccessArticle(user, accessLevel): boolean

// Examples:
canAccessArticle(null, 'public')              // true (public articles for all)
canAccessArticle(null, 'subscriber_free')     // false (need account)
canAccessArticle(freeSubscriber, 'subscriber_paid')  // false (need premium)
canAccessArticle(paidSubscriber, 'subscriber_paid')  // true
```

## SSR vs Static Generation

### Why SSR for Article Pages?

**Static (old approach):**
- Built at compile time
- Can't check user authentication
- Can't gate content dynamically
- Faster, but less flexible

**SSR (new approach):**
- Built per-request at runtime
- Has access to `Astro.locals.user`
- Can gate content based on auth status
- Slightly slower, but necessary for access control

### Performance Impact

- Minimal: Most queries cached in Supabase
- Article fetch: Still cached
- Access check: Single database lookup per request

## Testing

### Test Locally

1. Start dev server: `pnpm dev`

2. Create test articles:
   - Go to `/admin` → Create
   - Set different access levels
   - Publish

3. Test as anonymous:
   - Logout or use private browser
   - Visit `/lettres/article-slug`
   - Should see access gate

4. Test as subscriber:
   - Signup at `/inscription`
   - Visit locked article
   - Should see full content

5. Test premium gating:
   - Signup as free
   - Try to view premium article
   - Should see gate with "upgrade" CTA

### Database Verification

```sql
-- Check article access levels
SELECT title, slug, access_level FROM articles;

-- Find public articles
SELECT * FROM articles WHERE access_level = 'public';

-- Find subscriber-only articles
SELECT * FROM articles WHERE access_level = 'subscriber_free';
```

## Content Visibility Matrix

| Article Level | Public | Free Sub | Paid Sub | Redacteur | Admin |
|---|---|---|---|---|---|
| public | ✓ Full | ✓ Full | ✓ Full | ✓ Full | ✓ Full |
| subscriber_free | 🔒 Gate | ✓ Full | ✓ Full | ✓ Full | ✓ Full |
| subscriber_paid | 🔒 Gate | 🔒 Gate | ✓ Full | ✓ Full | ✓ Full |

## Future Enhancements

- [ ] Paywall fade-in (show 50% then gate)
- [ ] Email-triggered access (one-time links)
- [ ] Time-based access (free for 30 days, then paid)
- [ ] Referral access (share via social = free access)
- [ ] Preview mode (edit pages without auth)
- [ ] Analytics on gate impressions

## Troubleshooting

### Article shows gate to authenticated users

Check:
1. User subscription status in `profiles` table
2. Article `access_level` in Supabase
3. Browser console for auth errors

### Gate always shows (even for public articles)

Check:
1. Article `access_level` is set to 'public'
2. `canAccessArticle()` logic in `src/lib/auth.ts`
3. User profile loaded correctly

### SSR causing issues

If you see 404 on article pages:
1. Verify `export const prerender = false;` is at top
2. Check article slug matches URL
3. Verify article is published in Supabase

## Related Phases

- **Phase 4** — Subscriber authentication (prerequisite)
- **Phase 6** — Admin user management
- **Phase 7** — Stripe integration (payment gating)

## Next Steps

With Phase 5 complete:
1. Admin can set article access levels
2. Free and premium tiers can access appropriate content
3. Unauthenticated users see attractive access gates
4. Ready for Phase 7 (Stripe) to make premium tier monetized
