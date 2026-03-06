# 📚 Guide de Migration des Articles LinkedIn

Migration automatisée de 67 articles depuis LinkedIn vers le site **La Déraison**.

## 🎯 Processus

### Phase 1: Extraction des URLs LinkedIn (Manuelle - 30 min)

1. Accédez à la newsletter:
   https://www.linkedin.com/newsletters/la-lettre-de-la-d%C3%A9raison-7249708587780902912/

2. Scrollez et collectez les 67 articles avec:
   - Titre exact
   - URL LinkedIn
   - Date de publication

3. Mettez à jour `src/data/articles-raw.json`:

```json
[
  {
    "title": "La Malédiction Mélenchon",
    "linkedinUrl": "https://fr.linkedin.com/pulse/...",
    "date": "2026-03-01"
  },
  ...
]
```

**⚠️ Format requis:**
- `title`: String exact du titre LinkedIn
- `linkedinUrl`: URL complète (y compris slug)
- `date`: Format ISO (YYYY-MM-DD)

---

### Phase 2: Enrichissement Automatique (Script - 5-10 min)

Le script `scripts/enrich-articles.mjs` va:
1. Lire `articles-raw.json`
2. Fetcher chaque article LinkedIn
3. Extraire: excerpt, auteur, metadata
4. Générer slug unique
5. Catégoriser automatiquement
6. Sauvegarder dans `articles.json`

**Lancer le script:**

```bash
cd astro-shadcn-template
node scripts/enrich-articles.mjs
```

**Output:**

```
📚 Article Enrichment Script

📖 Reading: src/data/articles-raw.json
✓ Found 67 articles

🔄 Enriching articles from LinkedIn...

[01/67] Enriching: La Malédiction Mélenchon... ✅
[02/67] Enriching: Crève, c'est remboursé... ✅
...
[67/67] Enriching: ...

✅ ENRICHMENT COMPLETE

📊 Summary:
   Total articles: 67
   Categories:
     - Lettres: 45
     - Pamphlets: 15
     - Fosse: 7
   Date range: 2023-XX-XX → 2026-03-01
```

---

### Phase 3: Images (Semi-automatique)

Les images placeholder sont définies comme `/assets/articles/placeholder.jpg`.

**Options:**

#### A) Télécharger manuellement
```
src/assets/articles/
├── 01.jpg (La Malédiction Mélenchon)
├── 02.jpg (Crève, c'est remboursé)
├── 03.jpg
...
└── 67.jpg
```

Puis créer `scripts/update-article-images.mjs` pour matcher les images.

#### B) Télécharger depuis LinkedIn

```javascript
// scripts/download-article-images.mjs
// Downloade les images des articles LinkedIn
// Utilise les URLs dans linkedinUrl pour récupérer og:image
```

#### C) Utiliser des placeholders temporaires

Laisser `/assets/articles/placeholder.jpg` et améliorer plus tard.

---

### Phase 4: Vérification et Deploy (5 min)

1. **Vérifier le build:**
```bash
pnpm build
```

2. **Checker les articles:**
```bash
grep -c 'article-card' dist/index.html
# Doit afficher: 67 (ou plus si articles affichés multiple fois)
```

3. **Vérifier catégories:**
```bash
grep 'article-card__category' dist/index.html | sort | uniq -c
# Doit afficher les 3 catégories
```

4. **Tester localement:**
```bash
pnpm dev
# http://localhost:4002
```

5. **Deploy:**
```bash
pnpm build && git commit -m "Migration: 67 articles LinkedIn" && git push
```

---

## 📝 Structure des Données

### articles-raw.json (INPUT)
```json
[
  {
    "title": string,
    "linkedinUrl": string,
    "date": "YYYY-MM-DD"
  }
]
```

### articles.json (OUTPUT)
```json
[
  {
    "id": "uuid",
    "title": "La Malédiction Mélenchon",
    "excerpt": "Il existe, dans la nosologie...",
    "date": "2026-03-01",
    "category": "lettre|pamphlet|fosse",
    "image": "/assets/articles/placeholder.jpg",
    "slug": "la-malediction-melenchon",
    "author": "François Vannesson",
    "linkedinUrl": "https://..."
  }
]
```

### Interface TypeScript
```typescript
interface Article {
  id: string;           // UUID généré
  title: string;        // Titre de l'article
  excerpt: string;      // Premier paragraphe (~220 chars)
  date: string;         // ISO format (YYYY-MM-DD)
  category: 'lettre' | 'pamphlet' | 'fosse';
  image: string;        // Chemin local ou URL
  slug: string;         // URL-friendly, unique
  author?: string;      // Extrait de LinkedIn (François Vannesson)
  linkedinUrl?: string; // URL source pour backlink
}
```

---

## 🔄 Catégorisation Automatique

Le script catégorise les articles basé sur le titre:

| Category | Triggers |
|----------|----------|
| **fosse** | "Fosse", "Abîme", "Abyss" |
| **pamphlet** | "Circulaire", "Manifeste", "Déclaration", "Édit" |
| **lettre** | Défaut |

**Personnaliser:** Modifier `categorizeArticle()` dans `scripts/enrich-articles.mjs`

---

## 🐛 Troubleshooting

### "LinkedIn blocks requests"
LinkedIn a des restrictions anti-scraping. Le script ajoute:
- User-Agent header
- Délai de 1s entre requêtes
- Retry automatique avec fallback

Si bloqué: augmenter le délai dans le script

```javascript
// Dans enrich-articles.mjs
await new Promise(resolve => setTimeout(resolve, 2000)); // 2s au lieu de 1s
```

### "Excerpt is empty"
Certains articles ne retournent pas de contenu.

**Solution:** Le script utilise un fallback:
```javascript
excerpt: '📄 Article non rechargé. Veuillez compléter manuellement.'
```

Mettre à jour manuellement dans `articles.json`.

### "Article images not showing"
Les images sont des placeholders par défaut.

**Solutions:**
1. Ajouter images dans `src/assets/articles/`
2. Créer un script pour matcher les images aux articles
3. Utiliser une CDN externe (Cloudinary, etc.)

---

## 🚀 Production (Supabase)

Une fois stabilisé, remplacer la logique par une **vraie base de données**:

```typescript
// src/lib/articles.ts (FUTURE)
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

**Setup Supabase:**
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  date DATE NOT NULL,
  category TEXT CHECK(category IN ('lettre', 'pamphlet', 'fosse')),
  image TEXT,
  slug TEXT UNIQUE NOT NULL,
  author TEXT,
  linkedinUrl TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Populate avec les données de articles.json
```

---

## 📊 Résumé

| Étape | Temps | Automé? |
|-------|-------|---------|
| 1. Collecter URLs | 30 min | ❌ Manuel |
| 2. Enrichir contenu | 5-10 min | ✅ Script |
| 3. Images | Variable | ⚠️ Semi |
| 4. Vérifier | 5 min | ✅ Script |
| **TOTAL** | **45-50 min** | **~80%** |

✨ **Une fois terminé, les 67 articles s'affichent automatiquement en Bento Grid!**
