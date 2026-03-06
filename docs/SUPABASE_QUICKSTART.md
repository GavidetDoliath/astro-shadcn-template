# 🚀 Supabase Setup - La Déraison

Configuration rapide de Supabase pour les articles.

## ✅ Done - Credentials Set

Vous avez fourni:
- ✅ `SUPABASE_URL` = https://lettre-deraison.stackbase.sh
- ✅ `SUPABASE_KEY` (anon key)
- ✅ `.env.local` créé

## 📋 Step 1: Create Articles Table

1. Go to https://lettre-deraison.stackbase.sh
2. Dashboard → **SQL Editor**
3. Copy-paste tout le contenu de `docs/SUPABASE_ARTICLES_TABLE.sql`
4. Click **Run**

This will:
- ✅ Create `articles` table
- ✅ Add indexes for performance
- ✅ Create auto-update trigger
- ✅ Insert 6 sample articles

## ✨ Step 2: Test Connection

```bash
pnpm dev
```

Visit http://localhost:4000 and check:
- ✅ HeroSection displays
- ✅ ManifestoSection displays
- ✅ ArticlesSection shows 6 articles from Supabase
- ✅ Footer displays

## 📊 Expected Output

Landing page should show:
```
┌─────────────────────────────────┐
│       HeroSection               │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│     ManifestoSection             │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│   ArticlesSection (from DB!)    │
│                                 │
│  [6 articles in bento grid]     │
│  - Featured articles (big)      │
│  - Recent articles (small)      │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│         Footer                  │
└─────────────────────────────────┘
```

## 🎯 Next: Import 67 Articles

Once 67 articles are collected in `articles-raw.json`:

1. Enrich them:
```bash
node scripts/enrich-articles.mjs
```

2. Import to Supabase:
```bash
node scripts/import-articles-to-supabase.mjs
```

3. Rebuild:
```bash
pnpm build
```

## 🔧 How It Works

**Data Flow:**
```
Supabase Database (articles table)
         ↓
    src/db/supabase.js (client)
         ↓
    src/lib/articles.ts (queries)
         ↓
ArticlesSection.astro (display)
         ↓
        HTML
```

**Update Pattern:**
- Add/edit articles in Supabase Dashboard
- Site fetches latest articles on each build
- No manual data sync needed

## 📚 Article Fields

Each article in Supabase has:

```typescript
{
  id: UUID,           // Auto-generated
  title: TEXT,        // Article title
  excerpt: TEXT,      // Short preview
  content: TEXT,      // Full article (optional)
  date: DATE,         // Publication date
  category: TEXT,     // lettre | pamphlet | fosse
  image: TEXT,        // Image URL/path
  slug: TEXT,         // URL slug (unique)
  author: TEXT,       // Author name
  linkedinUrl: TEXT,  // Original source
  featured: BOOLEAN,  // Highlight in bento grid
  published: BOOLEAN, // Show/hide
  views_count: INT,   // Analytics
  created_at: TS,     // Auto-set
  updated_at: TS      // Auto-update
}
```

## 🐛 Troubleshooting

### "Error: No rows found"
- Check articles table exists in Supabase
- Check `.env.local` has correct credentials

### "Articles not displaying"
- Check browser console (F12) for errors
- Check Supabase SQL Editor → rows in articles table
- Verify `published = true` in DB

### "Build fails with Supabase error"
- Check network connection
- Try rebuilding: `pnpm build`
- Check Supabase status: https://status.supabase.com

## 📝 Environment Variables

Your `.env.local`:
```env
SUPABASE_URL=https://lettre-deraison.stackbase.sh
SUPABASE_KEY=eyJhbGc...
NODE_ENV=development
```

⚠️ **Never commit `.env.local` to git** (it's gitignored by default)

## 🚀 Deployment

When deploying (Vercel, Netlify, etc):

1. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

2. Build & deploy:
   ```bash
   pnpm build
   ```

3. Everything works automatically!

## ✅ Checklist

- [ ] `.env.local` created with credentials
- [ ] Supabase client installed: `pnpm add @supabase/supabase-js`
- [ ] Articles table created from SQL file
- [ ] `pnpm build` succeeds
- [ ] `pnpm dev` shows articles on homepage
- [ ] Sample 6 articles display correctly

## 📞 Next Steps

1. Run SQL file in Supabase (5 min)
2. Test locally: `pnpm dev` (1 min)
3. Collect 67 articles from LinkedIn (30 min)
4. Import to Supabase (10 min)
5. Deploy! (2 min)

---

**Ready to proceed?** Create the articles table and let's test! 🎉
