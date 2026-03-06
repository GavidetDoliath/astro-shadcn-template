#!/usr/bin/env node
/**
 * Scrape LinkedIn Newsletter Articles
 *
 * Collects all articles from La Lettre de la Déraison newsletter
 * and generates articles-raw.json
 *
 * REQUIREMENTS:
 * - pnpm add playwright
 * - Active internet connection
 *
 * Usage:
 *   node scripts/scrape-linkedin-newsletter.mjs
 *
 * OUTPUT:
 *   src/data/articles-raw.json (ready for enrichment)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if playwright is installed
let playwright;
try {
  const playwrightModule = await import('playwright');
  playwright = playwrightModule.default;
} catch (err) {
  console.error('❌ Playwright not installed');
  console.error('Install it with: pnpm add -D playwright');
  process.exit(1);
}

const NEWSLETTER_URL = 'https://www.linkedin.com/newsletters/la-lettre-de-la-d%C3%A9raison-7249708587780902912/';
const OUTPUT_FILE = path.join(__dirname, '../src/data/articles-raw.json');

/**
 * Scrape articles from LinkedIn newsletter
 */
async function scrapeNewsletter() {
  console.log('\n📰 LinkedIn Newsletter Scraper\n');
  console.log(`📄 URL: ${NEWSLETTER_URL}\n`);

  let browser;

  try {
    console.log('🌍 Launching browser...');
    browser = await playwright.chromium.launch({
      headless: true,
    });

    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    console.log('📖 Loading newsletter page...');
    await page.goto(NEWSLETTER_URL, { waitUntil: 'networkidle' });

    console.log('⏳ Scrolling to load all articles...\n');

    // Scroll multiple times to load all articles
    let lastHeight = await page.evaluate('document.body.scrollHeight');
    let scrollCount = 0;
    const maxScrolls = 30; // Max 30 scrolls to avoid infinite loops

    while (scrollCount < maxScrolls) {
      // Scroll down
      await page.evaluate('window.scrollBy(0, window.innerHeight)');
      await page.waitForTimeout(800);

      // Check if we've reached the bottom
      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === lastHeight) {
        console.log(`✓ Reached end (${scrollCount} scrolls)`);
        break;
      }

      lastHeight = newHeight;
      scrollCount++;
      process.stdout.write(`  Scrolled ${scrollCount}/${maxScrolls}...\r`);
    }

    console.log('\n📊 Extracting article data...\n');

    // Extract articles
    const articles = await page.evaluate(() => {
      const items = [];

      // Method 1: Find feed items
      const feedItems = document.querySelectorAll('[data-test-id="feed-item"]');

      feedItems.forEach(item => {
        // Find title
        const titleEl = item.querySelector('[data-test-id="feed-item-title"]');
        const title = titleEl?.innerText?.trim();

        if (!title) return; // Skip empty items

        // Find link
        const linkEl = item.querySelector('a[href*="/pulse/"]');
        const link = linkEl?.href;

        if (!link) return; // Skip items without links

        // Find date
        const dateEl = item.querySelector('time');
        const dateStr = dateEl?.getAttribute('datetime')?.split('T')[0];

        items.push({
          title,
          linkedinUrl: link,
          date: dateStr || new Date().toISOString().split('T')[0],
        });
      });

      return items;
    });

    if (articles.length === 0) {
      throw new Error(
        'No articles found. LinkedIn page structure may have changed or content not loaded.',
      );
    }

    console.log(`✅ Found ${articles.length} articles\n`);

    // Show sample
    console.log('📋 Sample articles:');
    articles.slice(0, 3).forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title.substring(0, 50)}...`);
    });
    console.log(`  ... and ${articles.length - 3} more\n`);

    // Save to file
    console.log(`💾 Saving to ${path.basename(OUTPUT_FILE)}...`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(articles, null, 2));

    console.log(`✅ SUCCESS!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total articles: ${articles.length}`);
    console.log(`   Date range: ${articles[articles.length - 1]?.date} → ${articles[0]?.date}`);

    console.log(`\n🚀 Next steps:`);
    console.log(`   1. node scripts/enrich-articles.mjs`);
    console.log(`   2. node scripts/import-articles-to-supabase.mjs`);
    console.log(`   3. pnpm build\n`);

    await context.close();
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('Target page') || error.message.includes('Protocol')) {
      console.error('\n💡 Possible LinkedIn blocking. Try:');
      console.error('   - Adding longer delays between actions');
      console.error('   - Using a different IP/network');
      console.error('   - Collecting manually via browser console');
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

scrapeNewsletter();
