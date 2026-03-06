# 🔧 Supabase Setup Guide

Setup Supabase database for La Déraison articles management.

## 📋 Prerequisites

1. Supabase account: https://app.supabase.com
2. Node.js with pnpm installed
3. La Déraison project initialized

## 🚀 Step 1: Install Supabase Client

```bash
cd astro-shadcn-template
pnpm add @supabase/supabase-js
```

## 🔐 Step 2: Get Supabase Credentials

1. Go to https://app.supabase.com
2. Create new project (or select existing)
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Secret** (optional) → `SUPABASE_SERVICE_ROLE_KEY`

## 🔑 Step 3: Setup Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Optional
```

**⚠️ IMPORTANT:**
- `.env.local` is gitignored (not tracked in git)
- Never commit secrets to git
- Service role key is for server-side only, never expose in client code

## 📊 Step 4: Create Articles Table

In Supabase dashboard, go to **SQL Editor** and run:

```sql
-- Create articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lettre', 'pamphlet', 'fosse')),
  image TEXT,
  slug TEXT UNIQUE NOT NULL,
  author TEXT DEFAULT 'La Rédaction',
  linkedinUrl TEXT,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_articles_date ON articles(date DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(published);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## 📥 Step 5: Import Initial Articles (from articles.json)

Run this script to populate the table:

```bash
node scripts/import-articles-to-supabase.mjs
```

See `scripts/import-articles-to-supabase.mjs` for full implementation.

## ✅ Step 6: Update src/lib/articles.ts

Replace the articles loading logic to use Supabase:

```typescript
// src/lib/articles.ts
import { supabase } from './supabase';

export async function getArticles(limit?: number) {
  const query = supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  return data as Article[];
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return undefined;
  }

  return data as Article;
}

export async function getArticlesByCategory(category: 'lettre' | 'pamphlet' | 'fosse', limit?: number) {
  const query = supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .eq('published', true)
    .order('date', { ascending: false });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  return data as Article[];
}
```

## 🔐 Row Level Security (Optional but Recommended)

Enable RLS for security:

```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read published articles
CREATE POLICY "Public can read published articles"
  ON articles
  FOR SELECT
  USING (published = true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage articles"
  ON articles
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

## 🧪 Test the Connection

```bash
# From project root
node -e "
import('./src/lib/supabase.ts').then(({ supabase }) => {
  supabase.from('articles').select('count(*)').then(({ data, error }) => {
    console.log(error ? '❌ ' + error.message : '✅ Connected! Articles: ' + data);
  });
});
"
```

## 🚀 Deploy

After setup, deploy as usual:

```bash
pnpm build
pnpm dev

# When ready to deploy:
git add .env.example ARTICLES_SETUP.md
git commit -m "Setup: Supabase integration"
git push
```

**⚠️ Don't forget:**
- Add `.env.local` to `.gitignore` (already done)
- Set environment variables in your hosting provider (Vercel, Netlify, etc.)

## 📝 Environment Variables in Production

### Vercel
1. Go to project Settings
2. Environment Variables
3. Add:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, for server actions)

### Netlify
Same process, but in **Site settings → Build & deploy → Environment**

### GitHub Pages
Not recommended for Supabase (no server-side requests)

## 🗑️ Cleanup

After importing to Supabase, you can remove:
- `src/data/articles.json` (data now in DB)
- Keep `src/data/articles-raw.json` as backup

Update `src/lib/articles.ts` to only use Supabase:

```typescript
// Remove this line:
// import articlesData from '../data/articles.json'

// Keep only Supabase queries
```

## 🔍 Debugging

### Connection issues
```bash
# Check .env.local exists
test -f .env.local && echo "✅ .env.local exists" || echo "❌ Missing .env.local"

# Check credentials format
grep PUBLIC_SUPABASE_URL .env.local
```

### Database issues
- Check Supabase dashboard: **Database → Tables → articles**
- Verify row count: `SELECT COUNT(*) FROM articles;`
- Check published status: `SELECT id, title, published FROM articles;`

### Runtime errors
- Check browser console (F12)
- Check server logs: `pnpm dev` output
- Verify PUBLIC_SUPABASE_* are prefixed (client-side)

## 📚 Resources

- Supabase docs: https://supabase.com/docs
- JavaScript client: https://supabase.com/docs/reference/javascript
- Astro + Supabase: https://supabase.com/partners/integrations/astro

## ✅ Checklist

- [ ] Supabase project created
- [ ] Credentials copied to `.env.local`
- [ ] `@supabase/supabase-js` installed
- [ ] `src/lib/supabase.ts` created
- [ ] Articles table created
- [ ] Initial articles imported
- [ ] `src/lib/articles.ts` updated
- [ ] Test connection works
- [ ] Build successful: `pnpm build`
- [ ] Test locally: `pnpm dev`
- [ ] Deploy with env variables set
