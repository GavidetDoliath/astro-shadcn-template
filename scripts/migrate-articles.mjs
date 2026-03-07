#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articlesJsonPath = path.join(__dirname, '../src/data/articles.json');

// Load environment variables
const {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase with service role (write access)
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateArticles() {
  try {
    // Read articles from JSON file
    if (!fs.existsSync(articlesJsonPath)) {
      console.error(`❌ Articles file not found: ${articlesJsonPath}`);
      process.exit(1);
    }

    const articlesData = fs.readFileSync(articlesJsonPath, 'utf-8');
    const articles = JSON.parse(articlesData);

    console.log(`📄 Found ${articles.length} articles to migrate`);
    console.log('---');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Delete existing articles by slug, then insert fresh
    for (const article of articles) {
      try {
        // Delete if exists
        await supabase.from('articles').delete().eq('slug', article.slug);

        // Insert new
        const { error } = await supabase.from('articles').insert({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          date: article.date,
          category: article.category,
          image: article.image,
          slug: article.slug,
          author: article.author,
          featured: article.featured ?? false,
          published: article.published ?? true,
        });

        if (error) {
          console.error(`❌ ${article.slug}: ${error.message}`);
          errors.push({ slug: article.slug, error: error.message });
          errorCount++;
        } else {
          console.log(`✅ ${article.slug}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ ${article.slug}: ${err.message}`);
        errors.push({ slug: article.slug, error: err.message });
        errorCount++;
      }
    }

    console.log('---');
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}/${articles.length}`);
    console.log(`   ❌ Failed: ${errorCount}/${articles.length}`);

    if (errors.length > 0) {
      console.log('\n📋 Errors:');
      errors.forEach(({ slug, error }) => {
        console.log(`   - ${slug}: ${error}`);
      });
    }

    if (errorCount === 0) {
      console.log('\n🎉 All articles migrated successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some articles failed to migrate.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error during migration:');
    console.error(error.message);
    process.exit(1);
  }
}

migrateArticles();
