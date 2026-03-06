# 📋 Guide de Collecte des Articles LinkedIn

## 📄 Objective

Remplir `articles-raw.json` avec les 67 articles de la newsletter "La Lettre de la Déraison".

## 🔗 Source

Newsletter LinkedIn:
https://www.linkedin.com/newsletters/la-lettre-de-la-d%C3%A9raison-7249708587780902912/

## 🛠️ Méthode 1: Extraction Manual (Plus simple)

### Étape 1: Accéder à la newsletter

1. Ouvrez https://www.linkedin.com/newsletters/...
2. Scrollez jusqu'au bas pour charger tous les articles
3. Ouvrez la console du navigateur (F12 → Console)

### Étape 2: Copier le JavaScript

Collez ce code dans la console:

```javascript
// Extrait les articles de la page LinkedIn
const articles = Array.from(document.querySelectorAll('[data-test-id="feed-item"]'))
  .map(item => {
    const titleEl = item.querySelector('[data-test-id="feed-item-title"]');
    const linkEl = item.querySelector('a[href*="/pulse/"]');
    const dateEl = item.querySelector('time');

    return {
      title: titleEl?.innerText?.trim() || 'Unknown',
      linkedinUrl: linkEl?.href || '',
      date: dateEl?.getAttribute('datetime')?.split('T')[0] || new Date().toISOString().split('T')[0]
    };
  })
  .filter(a => a.linkedinUrl); // Filter invalid entries

// Copier dans le clipboard
copy(JSON.stringify(articles, null, 2));
console.log(`✅ Copied ${articles.length} articles to clipboard`);
```

### Étape 3: Coller dans articles-raw.json

1. Copier le résultat: `Ctrl+C` (déjà dans clipboard)
2. Ouvrir `src/data/articles-raw.json`
3. Remplacer le contenu avec ce que vous avez copié
4. Sauvegarder

---

## 🛠️ Méthode 2: Extraction Semi-Auto (Plus robuste)

Si la méthode 1 ne fonctionne pas, utiliser Puppeteer:

```javascript
// scripts/scrape-newsletter.mjs
import puppeteer from 'puppeteer';

const url = 'https://www.linkedin.com/newsletters/la-lettre-de-la-d%C3%A9raison-7249708587780902912/';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Scroll pour charger les articles
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Extraire les articles
  const articles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-test-id="feed-item"]')).map(item => ({
      title: item.querySelector('[data-test-id="feed-item-title"]')?.innerText || '',
      linkedinUrl: item.querySelector('a[href*="/pulse/"]')?.href || '',
      date: item.querySelector('time')?.getAttribute('datetime')?.split('T')[0] || new Date().toISOString().split('T')[0]
    }));
  });

  console.log(JSON.stringify(articles, null, 2));
  await browser.close();
})();
```

---

## 🛠️ Méthode 3: Édition Manual (Plus lent mais sûr)

Si vous ne faites pas confiance au scraping:

1. Ouvrez la newsletter dans LinkedIn
2. Cliquez sur chaque article
3. Notez: titre, URL, date
4. Entrez dans `articles-raw.json` manuellement

```json
[
  {
    "title": "La Malédiction Mélenchon",
    "linkedinUrl": "https://fr.linkedin.com/pulse/la-mal%C3%A9diction-m%C3%A9lenchon-fran%C3%A7ois-vannesson-vcube",
    "date": "2026-03-01"
  }
]
```

---

## ✅ Validation

Après avoir rempli `articles-raw.json`:

```bash
# Vérifier le JSON est valide
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/articles-raw.json')))"

# Vérifier le nombre d'articles
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/articles-raw.json')).length + ' articles')"

# Vérifier les champs requis
node -e "
const articles = JSON.parse(require('fs').readFileSync('src/data/articles-raw.json'));
articles.forEach((a, i) => {
  if (!a.title || !a.linkedinUrl || !a.date) {
    console.log(\`❌ Article \${i}: Missing fields\`, a);
  }
});
console.log('✅ Validation complete');
"
```

---

## 📊 Structure attendue

```json
[
  {
    "title": "String (exact du LinkedIn)",
    "linkedinUrl": "https://fr.linkedin.com/pulse/[slug]",
    "date": "YYYY-MM-DD"
  },
  ...
]
```

**Obligatoire:**
- `title`: Non-vide, < 200 caractères
- `linkedinUrl`: URL valide, commence par https://
- `date`: Format ISO (YYYY-MM-DD), date valide

---

## 🚀 Après la collecte

Une fois `articles-raw.json` complété avec les 67 articles:

```bash
node scripts/enrich-articles.mjs
```

Le script va:
1. Lire `articles-raw.json` (67 articles)
2. Fetcher chaque article LinkedIn
3. Extraire excerpt, auteur
4. Générer slugs uniques
5. Créer `articles.json`

**Durée:** ~2-3 minutes pour 67 articles

---

## 🐛 Troubleshooting

### Erreur: "JSON invalid"
- Vérifiez que `articles-raw.json` est un array valide `[...]`
- Utilisez un JSON validator: https://jsonlint.com

### Manque d'articles
- La page LinkedIn a peut-être une limite de défilement
- Essayer de scroller plus de fois dans le script
- Ou utiliser Puppeteer/Playwright pour un scraping plus robuste

### Dates manquantes ou fausses
- LinkedIn peut ne pas exposer les dates en HTML
- Extraire depuis l'URL ou meta tags
- Fallback: utiliser date du jour

### URLs incomplètes
- Vérifier que les URLs commencent par `https://`
- Format correct: `https://fr.linkedin.com/pulse/[slug]`
- Pas d'espaces ou caractères spéciaux mal encodés

---

## 💡 Tips

1. **Batch processing**: Pas besoin de tout faire en une fois
   - Collecter 10-15 articles
   - Lancer `enrich-articles.mjs`
   - Vérifier la qualité
   - Continuer avec le reste

2. **Backup**: Sauvegarder `articles-raw.json` avant d'enrichir
   ```bash
   cp src/data/articles-raw.json src/data/articles-raw.backup.json
   ```

3. **Édition post-enrichment**: Vous pouvez éditer `articles.json` après enrichissement
   - Ajouter/modifier excerpts
   - Changer catégories
   - Mettre à jour slugs

4. **Réenrichissement**: Si vous modifiez `articles-raw.json`, relancer simplement:
   ```bash
   node scripts/enrich-articles.mjs
   ```
   (Cela créera un nouveau `articles.json`)

---

## 📞 Support

En cas de problème, vérifier:
- [ ] Node.js installé: `node --version`
- [ ] Dépendances: `pnpm install`
- [ ] Format JSON valide
- [ ] Connexion internet active
- [ ] URLs LinkedIn accessibles publiquement
