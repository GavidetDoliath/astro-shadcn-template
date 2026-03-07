#!/usr/bin/env node
/**
 * Fetch Full Article Contents from LinkedIn
 *
 * Reads articles-raw.json (LinkedIn URLs)
 * Extracts full article content from each URL
 * Saves to articles-complete.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_FILE = path.join(__dirname, '../src/data/articles-raw.json');
const COMPLETE_FILE = path.join(__dirname, '../src/data/articles-complete.json');
const ARTICLES_FILE = path.join(__dirname, '../src/data/articles.json');

async function fetchArticleHTML(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    };

    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function extractFullContent(html) {
  try {
    // Try JSON-LD articleBody (contains full text)
    const articleBodyMatch = html.match(/"articleBody"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
    if (articleBodyMatch?.[1]) {
      let text = articleBodyMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\/g, '')
        .trim();
      if (text.length > 500) return text;
    }

    // Fallback: Extract main article text from div
    const mainMatch = html.match(/<div[^>]*class="[^"]*artdeco-modal-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (mainMatch?.[1]) {
      let text = mainMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 500) return text;
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getSlugFromUrl(url) {
  const match = url.match(/\/pulse\/([^-]+-)+([a-z0-9]+)$/i);
  return match ? match[0].split('/pulse/')[1].split('-').slice(0, -1).join('-') : null;
}

async function fetchContents() {
  try {
    console.log('📖 Fetching full article contents from LinkedIn...\n');

    // Load articles.json to get slugs
    const articlesJson = JSON.parse(await fs.readFile(ARTICLES_FILE, 'utf-8'));
    const slugMap = Object.fromEntries(articlesJson.map(a => [a.linkedinUrl, a.slug]));

    // Load raw articles
    const rawData = JSON.parse(await fs.readFile(RAW_FILE, 'utf-8'));

    const contents = [];
    let success = 0;
    let failed = 0;

    for (const article of rawData) {
      try {
        const slug = slugMap[article.linkedinUrl];
        if (!slug) {
          console.warn(`⚠️  No slug found for: ${article.title}`);
          failed++;
          continue;
        }

        console.log(`⏳ Fetching: ${article.title}...`);
        const html = await fetchArticleHTML(article.linkedinUrl);
        const content = extractFullContent(html);

        if (content && content.length > 200) {
          contents.push({ slug, content });
          console.log(`   ✅ Got ${content.length} characters\n`);
          success++;
        } else {
          console.warn(`   ⚠️  Could not extract full content\n`);
          failed++;
        }

        // Rate limit - wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
        failed++;
      }
    }

    // Save to file
    await fs.writeFile(COMPLETE_FILE, JSON.stringify(contents, null, 2), 'utf-8');

    console.log('\n---');
    console.log(`📊 Results:`);
    console.log(`   ✅ Success: ${success}/${rawData.length}`);
    console.log(`   ❌ Failed: ${failed}/${rawData.length}`);
    console.log(`\n📄 Saved to: src/data/articles-complete.json`);

    if (success > 0) {
      console.log('\n💡 Next: Run this to populate database:');
      console.log('   node scripts/migrate-article-contents.mjs');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchContents();
