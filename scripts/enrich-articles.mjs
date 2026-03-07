#!/usr/bin/env node
/**
 * Enrich Articles Script
 * Converts articles-raw.json → articles.json
 *
 * Reads raw article list and enriches with:
 * - Excerpt from LinkedIn content
 * - Author name
 * - Generated slug (unique)
 * - Category (automatic classification)
 * - UUID
 *
 * Usage:
 *   node scripts/enrich-articles.mjs
 *
 * Output: src/data/articles.json
 */

import fs from 'fs/promises';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_FILE = path.join(__dirname, '../src/data/articles-raw.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/articles.json');

/**
 * Fetch article HTML from LinkedIn
 */
async function fetchArticleHTML(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 8000,
    };

    https
      .get(url, options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/**
 * Extract JSON-LD structured data from HTML
 */
function extractJsonLD(html) {
  try {
    const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) return null;

    const jsonStr = scriptMatch[1];
    const jsonMatch = jsonStr.match(/{[\s\S]*}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    return Array.isArray(data) ? data[0] : data;
  } catch (e) {
    return null;
  }
}

/**
 * Extract longer meaningful content as excerpt
 * LinkedIn articles can be substantial, so extract more text
 */
function extractExcerpt(html, fallback = '') {
  try {
    // Remove script and style tags that might contain trash content
    let cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Blacklist of content to skip (popup text, navigation, etc.)
    const skipPatterns = [
      /LinkedIn respecte/i,
      /cookies essentiels/i,
      /politiques?.*cookies/i,
      /en savoir plus/i,
      /politiques?.*utilisateur/i,
      /conditions.*service/i,
      /accepter.*continuer/i,
    ];

    // Strategy 1: Try JSON-LD articleBody (most reliable)
    const jsonLDMatch = cleaned.match(/"articleBody"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
    if (jsonLDMatch?.[1]) {
      let text = jsonLDMatch[1]
        .replace(/\\n/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Check if it's real content (not consent popup)
      if (text.length > 100 && !skipPatterns.some(p => p.test(text))) {
        return text.substring(0, 1200);
      }
    }

    // Strategy 2: Try og:description meta tag
    const descMatch = cleaned.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i) ||
                      cleaned.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    if (descMatch?.[1]) {
      const text = descMatch[1].trim();
      if (text.length > 100 && !skipPatterns.some(p => p.test(text))) {
        return text.substring(0, 1200);
      }
    }

    // Strategy 3: Find all paragraphs and combine, filtering junk
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = pRegex.exec(cleaned)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Skip empty, short, or blacklisted content
      if (text.length > 60 && !skipPatterns.some(p => p.test(text))) {
        paragraphs.push(text);
      }
    }

    // Get first few paragraphs
    if (paragraphs.length > 0) {
      // Use 2-3 paragraphs to build excerpt
      const combined = paragraphs.slice(0, 3).join(' ');
      if (combined.length > 100) {
        return combined.substring(0, 1200);
      }
    }

    // Strategy 4: Last resort - get from JSON-LD description
    const jsonLD = extractJsonLD(html);
    if (jsonLD?.description && jsonLD.description.length > 100) {
      return jsonLD.description.substring(0, 1200);
    }

    // Fallback
    return (fallback || 'Article content unavailable').substring(0, 1200);
  } catch {
    return (fallback || 'Article content unavailable').substring(0, 500);
  }
}

/**
 * Generate unique slug from title
 */
function generateSlug(title, existingSlugs = []) {
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Truncate to reasonable length
  if (slug.length > 60) {
    slug = slug.substring(0, 60).replace(/-+$/, '');
  }

  // Ensure uniqueness
  let finalSlug = slug;
  let counter = 1;
  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

/**
 * Categorize article based on title/content
 */
function categorizeArticle(title) {
  const lower = title.toLowerCase();

  // Explicit category indicators
  if (
    lower.includes('fosse') ||
    lower.includes('abîme') ||
    lower.includes('abyss')
  ) {
    return 'fosse';
  }

  if (
    lower.includes('circulaire') ||
    lower.includes('manifeste') ||
    lower.includes('déclaration') ||
    lower.includes('affichage') ||
    lower.includes('édit')
  ) {
    return 'pamphlet';
  }

  // Default to lettre
  return 'lettre';
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Enrich single article with metadata from LinkedIn
 */
async function enrichArticle(rawArticle, index, total) {
  const { title, linkedinUrl, date } = rawArticle;

  try {
    process.stdout.write(`[${String(index + 1).padStart(2, '0')}/${total}] Enriching: ${title.substring(0, 40)}...`);

    // Fetch article HTML
    const html = await fetchArticleHTML(linkedinUrl);

    // Extract data
    const jsonData = extractJsonLD(html);
    const excerpt = extractExcerpt(html, jsonData?.description || '');
    const author = jsonData?.author?.name || jsonData?.author || 'La Rédaction';

    const enrichedArticle = {
      id: crypto.randomUUID(),
      title: decodeHtmlEntities(title),
      excerpt: decodeHtmlEntities(excerpt),
      date: formatDate(date),
      category: categorizeArticle(title),
      image: '/assets/articles/placeholder.jpg', // Will be replaced with real images later
      slug: '', // Will be set after all articles are created
      author: decodeHtmlEntities(author),
      linkedinUrl: linkedinUrl,
    };

    console.log(' ✅');
    return enrichedArticle;
  } catch (error) {
    console.log(` ⚠️ (${error.message})`);

    // Fallback: create article without fetching
    return {
      id: crypto.randomUUID(),
      title: decodeHtmlEntities(title),
      excerpt: '📄 Article non rechargé. Veuillez compléter manuellement.',
      date: formatDate(date),
      category: categorizeArticle(title),
      image: '/assets/articles/placeholder.jpg',
      slug: '',
      author: 'La Rédaction',
      linkedinUrl: linkedinUrl,
    };
  }
}

/**
 * Main process
 */
async function main() {
  console.log('\n📚 Article Enrichment Script\n');
  console.log(`📖 Reading: ${RAW_FILE}`);

  try {
    // Read raw articles
    const rawData = await fs.readFile(RAW_FILE, 'utf-8');
    const rawArticles = JSON.parse(rawData);

    if (!Array.isArray(rawArticles) || rawArticles.length === 0) {
      throw new Error('articles-raw.json must contain an array of articles');
    }

    console.log(`✓ Found ${rawArticles.length} articles\n`);
    console.log('🔄 Enriching articles from LinkedIn...\n');

    // Enrich each article
    const enrichedArticles = [];
    const usedSlugs = [];

    for (let i = 0; i < rawArticles.length; i++) {
      const enriched = await enrichArticle(rawArticles[i], i, rawArticles.length);

      // Generate unique slug
      const slug = generateSlug(enriched.title, usedSlugs);
      enriched.slug = slug;
      usedSlugs.push(slug);

      enrichedArticles.push(enriched);

      // Add delay to avoid rate limiting
      if (i < rawArticles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Sort by date (most recent first)
    enrichedArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Write output
    console.log(`\n✍️ Writing enriched data to: ${OUTPUT_FILE}`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(enrichedArticles, null, 2));

    // Summary
    console.log('\n✅ ENRICHMENT COMPLETE\n');
    console.log('📊 Summary:');
    console.log(`   Total articles: ${enrichedArticles.length}`);
    console.log(`   Categories:`);
    console.log(`     - Lettres: ${enrichedArticles.filter(a => a.category === 'lettre').length}`);
    console.log(`     - Pamphlets: ${enrichedArticles.filter(a => a.category === 'pamphlet').length}`);
    console.log(`     - Fosse: ${enrichedArticles.filter(a => a.category === 'fosse').length}`);
    console.log(`   Date range: ${enrichedArticles[enrichedArticles.length - 1].date} → ${enrichedArticles[0].date}`);

    console.log('\n🚀 Next steps:');
    console.log('   1. Update src/lib/articles.ts to load from articles.json');
    console.log('   2. Replace placeholder images in src/assets/articles/');
    console.log('   3. Test ArticlesSection in dev server\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
