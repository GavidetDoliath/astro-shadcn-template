# Scripts de Migration

## 📚 enrich-articles.mjs

Convertit une liste raw d'articles LinkedIn en données enrichies pour le site.

### Usage

```bash
node scripts/enrich-articles.mjs
```

### Input

Lire depuis: `src/data/articles-raw.json`

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

### Output

Crée: `src/data/articles.json`

```json
[
  {
    "id": "uuid-here",
    "title": "...",
    "excerpt": "...",
    "date": "2026-03-01",
    "category": "lettre|pamphlet|fosse",
    "image": "/assets/articles/placeholder.jpg",
    "slug": "...",
    "author": "François Vannesson",
    "linkedinUrl": "..."
  },
  ...
]
```

### Étapes internes

1. **Fetch article HTML** depuis LinkedIn
2. **Parse JSON-LD** metadata (structured data)
3. **Extract excerpt** du premier paragraphe
4. **Auto-categorize** basé sur le titre
5. **Generate slug** unique (URL-safe)
6. **Fallback** en cas d'erreur (affiche ⚠️ dans output)

### Configuration

Délai entre requêtes (évite rate-limiting):

```javascript
// enrich-articles.mjs ligne ~250
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde
```

Augmenter si LinkedIn bloque:

```javascript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes
```

### Performance

- 6 articles: ~10 secondes
- 67 articles: ~2-3 minutes
- 200 articles: ~10 minutes

### Troubleshooting

#### "Article not found / Timeout"
- LinkedIn a changé la structure du site
- Améliorer le parser JSON-LD dans le script
- Utiliser une approche Playwright/Puppeteer

#### "Rate limited (429)"
- LinkedIn bloque trop de requêtes
- Augmenter le délai entre articles
- Ajouter délai initial (await delay(5000) au démarrage)

#### "Empty excerpt"
- Le script extrait le premier paragraphe
- Certains articles retournent du contenu JavaScript-only
- Fallback: "📄 Article non rechargé. Veuillez compléter manuellement."

---

## 🖼️ update-article-images.mjs (TODO)

Futur script pour matcher les images aux articles.

```bash
node scripts/update-article-images.mjs
```

Fonctionnalités:
- Scan `src/assets/articles/` pour les images
- Match avec articles par ordre de date
- Update les chemins dans `articles.json`

---

## 🗃️ validate-articles.mjs (TODO)

Valide la structure de `articles.json`:

```bash
node scripts/validate-articles.mjs
```

Checks:
- ✅ Format JSON valide
- ✅ Champs requis (id, title, slug, date, category)
- ✅ Slugs uniques
- ✅ Dates valides (ISO format)
- ✅ Categories correctes
- ✅ Images existent

---

## 📊 stats-articles.mjs (TODO)

Affiche des stats sur les articles:

```bash
node scripts/stats-articles.mjs
```

Output:
```
📊 Article Statistics

Total: 67
By category:
  - Lettres: 45 (67%)
  - Pamphlets: 15 (22%)
  - Fosse: 7 (10%)

Date range: 2023-01-15 → 2026-03-01
Average per month: 2.4

Most recent:
  - 2026-03-01: La Malédiction Mélenchon
  - 2026-02-28: ...

Slugs: 67 unique
Images: 0/67 présentes
```

---

## 🛠️ Development Notes

### Parser JSON-LD

LinkedIn utilise `<script type="application/ld+json">` pour les métadonnées structurées.

Structure typique:
```json
{
  "headline": "Article Title",
  "description": "...",
  "datePublished": "2026-03-01",
  "author": {
    "@type": "Person",
    "name": "François Vannesson"
  },
  "image": {
    "url": "https://..."
  },
  "articleBody": "..."
}
```

### Rate Limiting

LinkedIn détecte les patterns de scraping:
- ✅ User-Agent header obligatoire
- ✅ Délai entre requêtes (1-2s)
- ❌ Pas de headers spécifiques (Referer, Accept-Language)
- ❌ Accès simultanés

### Fallback Extraction

Si JSON-LD échoue, le script essaie:
1. Meta tags (`og:title`, `og:description`)
2. Premier paragraphe (`<p>`)
3. Valeurs par défaut

### Slug Generation

```javascript
// Example
"La Malédiction Mélenchon"
  → lowercase
  → NFC normalize (accents)
  → remove accents (NFD + filter)
  → replace non-alphanumeric with `-`
  → trim leading/trailing `-`
  → max 60 chars
  → append `-N` si duplicate

Result: "la-malediction-melenchon"
```

---

## 📋 Checklist

Avant de lancer `enrich-articles.mjs`:

- [ ] `src/data/articles-raw.json` complète avec 67 articles
- [ ] Chaque article a: title, linkedinUrl, date
- [ ] Format des URLs correct (https://fr.linkedin.com/pulse/...)
- [ ] Dates en format ISO (YYYY-MM-DD)
- [ ] Connexion internet active

Après enrich:

- [ ] `src/data/articles.json` créé
- [ ] 67 articles dans le JSON
- [ ] Vérifier quelques excerpts
- [ ] Build test: `pnpm build`
- [ ] Vérifier les slugs uniques
