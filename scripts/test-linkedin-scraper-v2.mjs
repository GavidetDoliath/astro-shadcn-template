#!/usr/bin/env node
/**
 * Improved LinkedIn article scraper
 * Extracts: title, date, excerpt, author, image
 * Output: Article object compatible with ArticleCard
 */

import https from 'https';

const ARTICLE_URL = 'https://fr.linkedin.com/pulse/la-mal%C3%A9diction-m%C3%A9lenchon-fran%C3%A7ois-vannesson-vcube';

/**
 * Fetch HTML
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
 * Extract JSON-LD structured data
 */
function extractJsonLD(html) {
  const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return {};

  try {
    const jsonStr = scriptMatch[1];
    // Handle multiple JSON objects in one script
    const jsonMatch = jsonStr.match(/{[\s\S]*}/);
    if (!jsonMatch) return {};

    const json = JSON.parse(jsonMatch[0]);

    // Flatten if it's an array
    const data = Array.isArray(json) ? json[0] : json;

    return {
      title: data.headline || data.name,
      description: data.description || '',
      datePublished: data.datePublished || data.uploadDate,
      dateModified: data.dateModified,
      author: data.author?.name || data.author,
      image: data.image?.url || data.image?.[0]?.url || data.image,
      text: data.text || data.articleBody,
    };
  } catch (e) {
    console.warn('⚠️ JSON-LD parsing failed:', e.message);
    return {};
  }
}

/**
 * Extract meta tags fallback
 */
function extractMetaTags(html) {
  const extractMeta = (name, property = null) => {
    const attr = property ? `property="${property}"` : `name="${name}"`;
    const regex = new RegExp(`<meta ${attr} content="([^"]*)"`, 'i');
    const match = html.match(regex);
    return match ? decodeHtmlEntities(match[1]) : '';
  };

  return {
    title: extractMeta('og:title', 'og:title') || extractMeta('title'),
    description: extractMeta('og:description', 'og:description') || extractMeta('description'),
    image: extractMeta('og:image', 'og:image'),
    url: extractMeta('og:url', 'og:url'),
  };
}

/**
 * Extract first paragraph as excerpt
 */
function extractExcerpt(html, fallback = '') {
  // Try to find article content
  const articleMatch = html.match(
    /<article[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/,
  );
  if (articleMatch && articleMatch[1]) {
    const text = articleMatch[1]
      .replace(/<[^>]+>/g, '')
      .trim()
      .substring(0, 250);
    return text;
  }

  // Fallback to first paragraph
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (pMatch && pMatch[1]) {
    return pMatch[1]
      .replace(/<[^>]+>/g, '')
      .trim()
      .substring(0, 250);
  }

  return fallback.substring(0, 250);
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  const textarea = { innerHTML: str };
  return textarea.innerHTML
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Generate slug
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
 * Categorize article
 */
function categorizeArticle(title) {
  const lower = title.toLowerCase();
  if (lower.includes('fosse')) return 'fosse';
  if (lower.includes('manifeste') || lower.includes('circulaire')) return 'pamphlet';
  return 'lettre';
}

/**
 * Format date (YYYY-MM-DD)
 */
function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generate Article object
 */
function generateArticleObject(data, url) {
  const title = data.title || 'Sans titre';
  const slug = generateSlug(title);
  const excerpt = data.excerpt || data.description || '';
  const date = formatDate(data.datePublished);

  // Use article image if available, else placeholder
  const image = data.image && !data.image.includes('linkedin-bug') ? data.image : '/assets/articles/placeholder.jpg';

  return {
    id: crypto.randomUUID(),
    title: title,
    excerpt: excerpt,
    date: date,
    category: categorizeArticle(title),
    image: image,
    slug: slug,
    author: data.author || 'La Rédaction',
    linkedinUrl: url,
    sourceDescription: data.description || excerpt,
  };
}

/**
 * Main
 */
async function main() {
  console.log('\n🔍 LinkedIn Article Scraper v2\n');
  console.log(`📄 URL: ${ARTICLE_URL}\n`);

  try {
    console.log('⏳ Fetching...');
    const html = await fetchUrl(ARTICLE_URL);
    console.log('✓ HTML fetched\n');

    console.log('📊 Extracting JSON-LD...');
    const jsonData = extractJsonLD(html);

    console.log('📊 Extracting meta tags...');
    const metaData = extractMetaTags(html);

    console.log('✂️ Extracting excerpt...');
    const excerpt = extractExcerpt(html, jsonData.description || metaData.description);

    const mergedData = {
      title: jsonData.title || metaData.title,
      description: jsonData.description || metaData.description,
      datePublished: jsonData.datePublished,
      author: jsonData.author,
      image: jsonData.image || metaData.image,
      excerpt: excerpt,
    };

    console.log('🏗️ Generating Article object...\n');
    const article = generateArticleObject(mergedData, ARTICLE_URL);

    // Display result
    console.log('═'.repeat(60));
    console.log('✅ EXTRACTED ARTICLE:\n');
    console.log(JSON.stringify(article, null, 2));
    console.log('\n' + '═'.repeat(60));

    console.log('\n📋 VALIDATION:\n');
    const checks = [
      ['Title', article.title, !!article.title],
      ['Slug', article.slug, !!article.slug],
      ['Date', article.date, !!article.date],
      ['Category', article.category, ['lettre', 'pamphlet', 'fosse'].includes(article.category)],
      ['Excerpt', `${article.excerpt.substring(0, 50)}...`, article.excerpt.length > 20],
      ['Author', article.author, !!article.author],
      ['LinkedIn URL', article.linkedinUrl.split('/').pop(), !!article.linkedinUrl],
    ];

    checks.forEach(([field, value, valid]) => {
      const icon = valid ? '✅' : '⚠️';
      console.log(`${icon} ${field.padEnd(15)}: ${String(value).substring(0, 40)}`);
    });

    const allValid = checks.every(c => c[2]);
    console.log(`\n${allValid ? '✨ READY FOR MIGRATION' : '⚠️ NEEDS ADJUSTMENT'}`);

    // Show usage
    console.log('\n🚀 NEXT STEPS:\n');
    console.log('1. Extract 67 articles with this script');
    console.log('2. Save to: src/data/articles.json');
    console.log('3. Update src/lib/articles.ts to load from JSON');
    console.log('4. ArticlesSection.astro will display them\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
