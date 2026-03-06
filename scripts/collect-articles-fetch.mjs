#!/usr/bin/env node
/**
 * Collect LinkedIn Newsletter Articles (Fetch Method)
 *
 * Alternative method using fetch (no browser required)
 * Fetches the newsletter page and extracts article links
 *
 * LIMITATIONS:
 * - Only gets articles visible in initial page load
 * - May not get all 67 articles (needs scrolling)
 * - If it doesn't work: use browser console method
 *
 * Usage:
 *   node scripts/collect-articles-fetch.mjs
 *
 * OUTPUT:
 *   src/data/articles-raw.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NEWSLETTER_URL = 'https://www.linkedin.com/newsletters/la-lettre-de-la-d%C3%A9raison-7249708587780902912/';
const OUTPUT_FILE = path.join(__dirname, '../src/data/articles-raw.json');

/**
 * Extract articles from HTML
 */
function extractArticlesFromHTML(html) {
  const articles = [];
  const linkRegex = /href="(https:\/\/fr\.linkedin\.com\/pulse\/[^"]+)"/g;
  const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/g;
  const dateRegex = /datetime="([^"]+)"/g;

  // Extract links
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    // Filter to only article URLs
    if (url.includes('/pulse/')) {
      articles.push({
        linkedinUrl: url,
        title: 'Article Title', // Will be updated
        date: new Date().toISOString().split('T')[0],
      });
    }
  }

  return articles;
}

/**
 * Main collection function
 */
async function collectArticles() {
  console.log('\n📰 LinkedIn Newsletter Article Collector\n');
  console.log(`📄 URL: ${NEWSLETTER_URL}\n`);

  try {
    console.log('⏳ Fetching newsletter page...');
    const response = await fetch(NEWSLETTER_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('✓ Page loaded\n');

    console.log('🔍 Extracting articles...');
    const articles = extractArticlesFromHTML(html);

    if (articles.length === 0) {
      console.error('❌ No articles found');
      console.error('\n💡 ALTERNATIVE METHODS:\n');
      console.error('Option 1: Browser Console Method (Best)');
      console.error('──────────────────────────────────────');
      console.error('1. Open: ' + NEWSLETTER_URL);
      console.error('2. Press F12 (Developer Tools)');
      console.error('3. Go to Console tab');
      console.error('4. Paste this code:\n');
      console.error(`
const articles = Array.from(document.querySelectorAll('[data-test-id="feed-item"]'))
  .map(item => ({
    title: item.querySelector('[data-test-id="feed-item-title"]')?.innerText?.trim() || '',
    linkedinUrl: item.querySelector('a[href*="/pulse/"]')?.href || '',
    date: item.querySelector('time')?.getAttribute('datetime')?.split('T')[0] || ''
  }))
  .filter(a => a.linkedinUrl);

copy(JSON.stringify(articles, null, 2));
console.log(\`✅ Copied \${articles.length} articles\`);
`);
      console.error('5. Paste result into src/data/articles-raw.json\n');

      process.exit(1);
    }

    console.log(`✅ Found ${articles.length} articles\n`);

    // Save to file
    console.log(`💾 Saving to ${path.basename(OUTPUT_FILE)}...`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(articles, null, 2));

    console.log(`✅ SUCCESS!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Articles: ${articles.length}`);

    if (articles.length < 67) {
      console.log(`\n⚠️ Only ${articles.length} articles found (expected 67)`);
      console.log(`   Reason: Initial page load only, no scrolling\n`);
      console.log('💡 To get all 67 articles, use the Browser Console method above.\n');
    }

    console.log(`🚀 Next steps:`);
    console.log(`   1. If you have all 67 articles, run:`);
    console.log(`      node scripts/enrich-articles.mjs`);
    console.log(`   2. Then import to Supabase:`);
    console.log(`      node scripts/import-articles-to-supabase.mjs\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nℹ️ Use the Browser Console method instead (see above)');
    process.exit(1);
  }
}

collectArticles();
