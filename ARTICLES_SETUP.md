# 📚 Setup Articles Migration

Complete guide to migrate 67 articles from LinkedIn to La Déraison website.

## 🎯 Summary

Transform 67 LinkedIn articles into a working articles section displayed in bento grid layout.

**Total time:** ~45-50 minutes (80% automated)
- Manual collection: 30 min
- Automated enrichment: 5-10 min
- Build & verify: 5 min

## 📋 What's Ready

### Components ✅
- `src/components/ArticlesSection.astro` — Bento grid layout
- `src/components/ArticleCard.astro` — Individual article card
- Test with 6 sample articles already working

### Automation Scripts ✅
- `scripts/enrich-articles.mjs` — Production-ready enrichment script
- Fetches LinkedIn, extracts metadata, generates slugs
- Handles errors gracefully with fallbacks

### Documentation ✅
- `docs/MIGRATION_ARTICLES.md` — Complete technical guide
- `src/data/ARTICLES_COLLECTION_GUIDE.md` — Step-by-step how-to
- `scripts/README.md` — Script technical details

## 🚀 Quick Start

### 1️⃣ Collect Articles (30 min)

Visit: https://www.linkedin.com/newsletters/la-lettre-de-la-d%C3%A9raison-7249708587780902912/

**Option A: Browser Console (Fastest)**
```javascript
// In browser console (F12):
const articles = Array.from(document.querySelectorAll('[data-test-id="feed-item"]'))
  .map(item => ({
    title: item.querySelector('[data-test-id="feed-item-title"]')?.innerText?.trim() || '',
    linkedinUrl: item.querySelector('a[href*="/pulse/"]')?.href || '',
    date: item.querySelector('time')?.getAttribute('datetime')?.split('T')[0] || ''
  }))
  .filter(a => a.linkedinUrl);

copy(JSON.stringify(articles, null, 2));
console.log(`✅ Copied ${articles.length} articles`);
```

**Option B: Manual (Safest)**
- Click each article
- Note title, URL, date
- Paste into `src/data/articles-raw.json`

### 2️⃣ Fill articles-raw.json

File: `src/data/articles-raw.json`

```json
[
  {
    "title": "Article Title",
    "linkedinUrl": "https://fr.linkedin.com/pulse/...",
    "date": "2026-03-01"
  },
  // ... 67 articles total
]
```

**Validate:**
```bash
# Check JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/articles-raw.json')).length)"
```

### 3️⃣ Run Enrichment Script (5-10 min)

```bash
cd astro-shadcn-template
node scripts/enrich-articles.mjs
```

The script will:
- Read all 67 articles from `articles-raw.json`
- Fetch each article from LinkedIn
- Extract: excerpt, author, metadata
- Generate unique slugs
- Auto-categorize (lettre/pamphlet/fosse)
- Output to `src/data/articles.json`

**Output example:**
```
📚 Article Enrichment Script

📖 Reading: src/data/articles-raw.json
✓ Found 67 articles

🔄 Enriching articles from LinkedIn...

[01/67] Enriching: La Malédiction Mélenchon... ✅
[02/67] Enriching: Crève, c'est remboursé... ✅
...

✅ ENRICHMENT COMPLETE

📊 Summary:
   Total articles: 67
   Categories:
     - Lettres: 45
     - Pamphlets: 15
     - Fosse: 7
```

### 4️⃣ Build & Verify (5 min)

```bash
pnpm build
```

Check:
```bash
# Count articles in output
grep -c 'article-card' dist/index.html
# Should output: 67+ (articles may appear multiple times in markup)
```

Test locally:
```bash
pnpm dev
# Visit http://localhost:4000
```

## 📁 Files Structure

```
astro-shadcn-template/
├── src/
│   ├── components/
│   │   ├── ArticlesSection.astro  (NEW)
│   │   └── ArticleCard.astro      (NEW)
│   ├── data/
│   │   ├── articles-raw.json      (NEW - You fill this)
│   │   ├── articles.json          (NEW - Auto-generated)
│   │   └── ARTICLES_COLLECTION_GUIDE.md
│   ├── lib/
│   │   └── articles.ts            (UPDATED - Loads from JSON)
│   └── pages/
│       └── index.astro            (UPDATED - Added ArticlesSection)
├── scripts/
│   ├── enrich-articles.mjs        (NEW - Main script)
│   ├── test-linkedin-scraper.mjs  (NEW - Testing)
│   └── README.md                  (NEW - Script docs)
└── docs/
    └── MIGRATION_ARTICLES.md      (NEW - Complete guide)
```

## 🔄 Data Flow

```
LinkedIn Newsletter
       ↓
articles-raw.json (minimal)
       ↓
[enrich-articles.mjs]
       ↓
articles.json (enriched)
       ↓
src/lib/articles.ts
       ↓
ArticlesSection.astro
       ↓
Landing page with 6 featured articles in bento grid
```

## 🎨 What's Displayed

Landing page (`/`) will show:

```
┌─────────────────────────────────────┐
│         HeroSection                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      ManifestoSection                │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      ArticlesSection (6 latest)      │
│                                     │
│  ┌──────────────┬─────────┬─────┐  │
│  │   Article 1  │Article 2│ 3  │  │
│  │   (2×2)      │ (1×2)   │    │  │
│  │              │         │    │  │
│  ├──────────────┼─────────┼─────┤  │
│  │  4   │  5    │   6     │    │  │
│  └──────────────┴─────────┴─────┘  │
│                                     │
│      [Voir tous les articles →]     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│          Footer                     │
└─────────────────────────────────────┘
```

**Bento Grid:**
- 2 featured articles (large, 2×2 grid)
- 4 recent articles (small, 1×1 each)
- Responsive: 1 column on mobile

## 📝 Article Fields

Each article in `articles.json`:

```typescript
{
  id: "uuid",                    // Auto-generated
  title: "Article Title",        // From LinkedIn
  excerpt: "First paragraph...", // Auto-extracted (~220 chars)
  date: "2026-03-01",           // ISO format
  category: "lettre",           // Auto-categorized
  image: "/assets/articles/placeholder.jpg", // Placeholder
  slug: "article-title",        // Auto-generated, unique
  author: "François Vannesson", // Auto-extracted
  linkedinUrl: "https://..."    // Source URL
}
```

## 🏷️ Categories (Auto)

Script automatically categorizes based on title:

| Category | Trigger Keywords |
|----------|-----------------|
| **fosse** | Fosse, Abîme, Abyss |
| **pamphlet** | Circulaire, Manifeste, Déclaration, Édit |
| **lettre** | (default for everything else) |

To override: Edit `articles.json` manually after generation.

## 🖼️ Images

Currently using placeholders: `/assets/articles/placeholder.jpg`

**To replace with real images:**

Option A: Manual
1. Download images from LinkedIn (og:image)
2. Save to `src/assets/articles/01.jpg`, `02.jpg`, etc.
3. Update paths in `articles.json`

Option B: Auto-script (TODO)
- Create `scripts/download-article-images.mjs`
- Extract og:image from LinkedIn URLs
- Download and save locally

Option C: Keep placeholders
- Works fine for now
- Update images later

## 🐛 Troubleshooting

### "JSON parse error in articles-raw.json"
- Validate JSON: https://jsonlint.com
- Check format: must be `[{ title, linkedinUrl, date }, ...]`
- No trailing commas

### "LinkedIn returns 429 (rate limit)"
Edit `scripts/enrich-articles.mjs` line ~250:
```javascript
// Increase delay between requests
await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds instead of 1
```

### "Excerpts are empty"
- Some LinkedIn articles don't load properly
- Fallback: "📄 Article non rechargé. Veuillez compléter manuellement."
- Manually edit `articles.json` to add excerpt

### "Slugs are duplicates"
- Script auto-appends `-2`, `-3`, etc.
- If issue persists, manually edit in `articles.json`

### "Articles don't show in build"
```bash
# Check they're in articles.json
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/articles.json')).length)"

# Check build log
pnpm build 2>&1 | grep -i error
```

## 🔮 Future: Supabase Integration

Once stabilized, connect to Supabase database:

```typescript
// src/lib/articles.ts (future)
import { supabase } from './supabase';

export async function getArticles(limit?: number) {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  return data as Article[];
}
```

This will allow:
- Adding/editing articles in real-time
- No need to re-deploy to update content
- Admin dashboard for editorial team

## 📚 Full Documentation

- **Technical guide:** `docs/MIGRATION_ARTICLES.md`
- **Step-by-step:** `src/data/ARTICLES_COLLECTION_GUIDE.md`
- **Script details:** `scripts/README.md`

## ✅ Checklist

Before running the enrichment script:

- [ ] All 67 articles in `articles-raw.json`
- [ ] Each has: title, linkedinUrl, date
- [ ] JSON is valid (no syntax errors)
- [ ] Internet connection active
- [ ] No VPN (LinkedIn may block)

After enrichment:

- [ ] `articles.json` created
- [ ] `pnpm build` succeeds
- [ ] Articles display on homepage
- [ ] Categories look correct
- [ ] Slugs are unique

## 🚀 Next Steps

1. Collect 67 articles from LinkedIn newsletter
2. Fill `src/data/articles-raw.json`
3. Run `node scripts/enrich-articles.mjs`
4. Run `pnpm build`
5. Test with `pnpm dev`
6. Deploy!

---

**Questions?** Check the docs or test with the sample 6 articles that are already in `articles.json`.

Happy migrating! 🎉
