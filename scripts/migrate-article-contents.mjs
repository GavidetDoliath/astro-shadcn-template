#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentsJsonPath = path.join(__dirname, '../src/data/articles-complete.json');

const { PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateContents() {
  try {
    if (!fs.existsSync(contentsJsonPath)) {
      console.error(`❌ Contents file not found: ${contentsJsonPath}`);
      process.exit(1);
    }

    const contentsData = fs.readFileSync(contentsJsonPath, 'utf-8');
    const contents = JSON.parse(contentsData);

    console.log(`📄 Found ${contents.length} articles to enrich with full content`);
    console.log('---\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const item of contents) {
      try {
        // Update article with full content
        const { error } = await supabase
          .from('articles')
          .update({
            content: item.content,
          })
          .eq('slug', item.slug);

        if (error) {
          console.error(`❌ ${item.slug}: ${error.message}`);
          errors.push({ slug: item.slug, error: error.message });
          errorCount++;
        } else {
          console.log(`✅ ${item.slug}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ ${item.slug}: ${err.message}`);
        errors.push({ slug: item.slug, error: err.message });
        errorCount++;
      }
    }

    console.log('\n---');
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}/${contents.length}`);
    console.log(`   ❌ Failed: ${errorCount}/${contents.length}`);

    if (errors.length > 0) {
      console.log('\n📋 Errors:');
      errors.forEach(({ slug, error }) => {
        console.log(`   - ${slug}: ${error}`);
      });
    }

    if (errorCount === 0) {
      console.log('\n🎉 All article contents migrated successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some articles failed. Make sure the "content" column exists in Supabase.');
      console.log('Add it manually: ALTER TABLE articles ADD COLUMN content TEXT;');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

migrateContents();
