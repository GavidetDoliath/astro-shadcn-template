#!/usr/bin/env node
/**
 * Import Articles to Supabase
 *
 * Imports articles from src/data/articles.json to Supabase database
 *
 * REQUIREMENTS:
 * - .env.local with SUPABASE_SERVICE_ROLE_KEY set
 * - Supabase articles table created (see docs/SUPABASE_SETUP.md)
 * - @supabase/supabase-js installed (pnpm add @supabase/supabase-js)
 *
 * Usage:
 *   node scripts/import-articles-to-supabase.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required:');
  console.error('  - PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in .env.local (see docs/SUPABASE_SETUP.md)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Main import function
 */
async function importArticles() {
  console.log('\n📚 Import Articles to Supabase\n');

  try {
    // Read articles from JSON
    console.log('📖 Reading articles from src/data/articles.json...');
    const articlesPath = path.join(__dirname, '../src/data/articles.json');
    const articlesJson = await fs.readFile(articlesPath, 'utf-8');
    const articles = JSON.parse(articlesJson);

    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('articles.json is empty or invalid');
    }

    console.log(`✓ Found ${articles.length} articles\n`);

    // Transform articles for Supabase
    const articlesToInsert = articles.map(article => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      date: article.date,
      category: article.category,
      image: article.image,
      slug: article.slug,
      author: article.author || 'La Rédaction',
      linkedinUrl: article.linkedinUrl,
      published: true,
      featured: false,
    }));

    // Upload to Supabase
    console.log('📤 Uploading to Supabase...\n');
    const { data, error } = await supabase.from('articles').upsert(articlesToInsert, {
      onConflict: 'id',
    });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Verify import
    console.log('✓ Upload complete\n');

    const { count, error: countError } = await supabase.from('articles').select('*', { count: 'exact' });

    if (countError) {
      throw new Error(`Count error: ${countError.message}`);
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('✅ IMPORT SUCCESSFUL\n');
    console.log(`Total articles in database: ${count}`);
    console.log('\n📊 By category:');

    const { data: categories } = await supabase.from('articles').select('category, count');

    articles.forEach(article => {
      const categoryLabel = {
        lettre: '📝 Lettres',
        pamphlet: '📢 Pamphlets',
        fosse: '🕳️ Fosse',
      }[article.category];

      const count = articles.filter(a => a.category === article.category).length;
      console.log(`  ${categoryLabel}: ${count}`);
    });

    console.log('\n🚀 Next steps:');
    console.log('  1. Update src/lib/articles.ts to use Supabase queries');
    console.log('  2. Remove/archive src/data/articles.json');
    console.log('  3. Deploy with SUPABASE_SERVICE_ROLE_KEY set');
    console.log('  4. Test with: pnpm dev\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importArticles();
