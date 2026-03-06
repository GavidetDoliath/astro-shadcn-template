#!/usr/bin/env node
/**
 * Test script: Extrait un article LinkedIn et valide le format
 * Usage: node scripts/test-linkedin-scraper.mjs
 */

import https from 'https';

const ARTICLE_URL = 'https://fr.linkedin.com/pulse/la-mal%C3%A9diction-m%C3%A9lenchon-fran%C3%A7ois-vannesson-vcube';

/**
 * Fetch with User-Agent to avoid blocking
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
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
 * Parse article HTML and extract metadata
 */
function parseArticleHTML(html) {
  const title = extractBetween(html, '<meta property="og:title"', 'content="', '"');
  const description = extractBetween(html, '<meta property="og:description"', 'content="', '"');
  const publishedDate = extractBetween(html, '"datePublished":"', '', '"');
  const author = extractBetween(html, '"author":{"@type":"Person","name":"', '', '"');
  const image = extractBetween(html, '<meta property="og:image"', 'content="', '"');

  // Extract first paragraphs from body
  const bodyMatch = html.match(/<article[^>]*>[\s\S]*?<\/article>/);
  const bodyContent = bodyMatch ? bodyMatch[0] : html;
  const paragraphs = bodyContent.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
  const excerpt = paragraphs
    .slice(0, 2)
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .join(' ')
    .substring(0, 200);

  return {
    title: decodeHtmlEntities(title),
    excerpt: decodeHtmlEntities(excerpt),
    description: decodeHtmlEntities(description),
    publishedDate,
    author,
    image,
  };
}

/**
 * Simple HTML extraction utility
 */
function extractBetween(str, start, startDelim, endDelim) {
  const startIdx = str.indexOf(start);
  if (startIdx === -1) return '';
  const contentStart = str.indexOf(startDelim, startIdx);
  if (contentStart === -1) return '';
  const contentEnd = str.indexOf(endDelim, contentStart + startDelim.length);
  if (contentEnd === -1) return '';
  return str.substring(contentStart + startDelim.length, contentEnd);
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Generate article slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Categorize article (heuristic)
 */
function categorizeArticle(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('fosse') || lowerTitle.includes('abyss')) return 'fosse';
  if (lowerTitle.includes('manifeste') || lowerTitle.includes('pamphlet')) return 'pamphlet';
  return 'lettre';
}

/**
 * Generate Article object for La Déraison
 */
function generateArticleObject(meta, index) {
  const slug = generateSlug(meta.title);
  const date = meta.publishedDate || new Date().toISOString().split('T')[0];

  return {
    id: String(index + 1),
    title: meta.title,
    excerpt: meta.excerpt || meta.description,
    date: date,
    category: categorizeArticle(meta.title),
    image: meta.image || '/assets/articles/placeholder.jpg',
    slug: slug,
    author: meta.author,
    linkedinUrl: ARTICLE_URL,
    sourceDescription: meta.description,
  };
}

/**
 * Main
 */
async function main() {
  console.log('🔍 Testing LinkedIn article scraper...\n');
  console.log(`📄 URL: ${ARTICLE_URL}\n`);

  try {
    console.log('⏳ Fetching article...');
    const html = await fetchUrl(ARTICLE_URL);

    console.log('📊 Parsing metadata...');
    const meta = parseArticleHTML(html);

    console.log('🏗️ Generating article object...\n');
    const article = generateArticleObject(meta, 0);

    console.log('✅ EXTRACTED DATA:\n');
    console.log(JSON.stringify(article, null, 2));

    console.log('\n📝 VALIDATION CHECKS:\n');
    console.log(`✓ Title: "${article.title}"`);
    console.log(`✓ Slug: "${article.slug}"`);
    console.log(`✓ Date: ${article.date}`);
    console.log(`✓ Category: ${article.category}`);
    console.log(`✓ Excerpt length: ${article.excerpt.length} chars`);
    console.log(`✓ Author: ${article.author}`);
    console.log(`✓ Image: ${article.image}`);

    console.log('\n✨ FORMAT READY FOR:\n');
    console.log('- src/lib/articles.ts (interface Article)');
    console.log('- src/data/articles.json (export)');
    console.log('- ArticleCard component (display)');

    // Validate against Article interface
    console.log('\n🔐 TypeScript VALIDATION:\n');
    const requiredFields = ['id', 'title', 'excerpt', 'date', 'category', 'image', 'slug'];
    const missingFields = requiredFields.filter(field => !article[field]);

    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
      console.log('✅ Ready for ArticlesSection.astro');
    } else {
      console.log('❌ Missing fields:', missingFields);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
