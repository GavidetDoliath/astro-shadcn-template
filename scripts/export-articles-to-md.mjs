import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '❌ Missing Supabase credentials in .env: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY',
  );
  process.exit(1);
}

// Initialize Supabase client with service role for full access
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || SUPABASE_KEY);

const CONTENT_DIR = './src/content/articles';
const ASSETS_DIR = './src/assets/articles';

// Create directories if they don't exist
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  console.log(`✓ Created ${CONTENT_DIR}`);
}

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`✓ Created ${ASSETS_DIR}`);
}

async function downloadImage(imageUrl, slug) {
  if (!imageUrl) return null;

  try {
    // If it's a full URL (http/https), download it
    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.warn(`  ⚠ Failed to download image for ${slug}: ${response.statusText}`);
        return null;
      }

      const buffer = await response.arrayBuffer();
      const ext = new URL(imageUrl).pathname.split('.').pop() || 'jpg';
      const filename = `${slug}.${ext}`;
      const filepath = path.join(ASSETS_DIR, filename);

      fs.writeFileSync(filepath, Buffer.from(buffer));
      console.log(`  ✓ Downloaded image: ${filename}`);
      return `../../assets/articles/${filename}`;
    }

    // If it's a storage path from Stackbase, download from storage
    if (imageUrl.includes('storage')) {
      try {
        // Extract bucket and path from Stackbase storage URL
        // Format: /storage/v1/object/public/bucket/path/to/image
        const match = imageUrl.match(/storage\/v1\/object\/public\/([^/]+)\/(.*)/);
        if (match) {
          const bucket = match[1];
          const storagePath = match[2];

          const { data, error } = await supabase.storage.from(bucket).download(storagePath);

          if (error) {
            console.warn(`  ⚠ Failed to download from storage for ${slug}: ${error.message}`);
            return null;
          }

          const ext = storagePath.split('.').pop() || 'jpg';
          const filename = `${slug}.${ext}`;
          const filepath = path.join(ASSETS_DIR, filename);

          // Convert blob to buffer
          const buffer = await data.arrayBuffer();
          fs.writeFileSync(filepath, Buffer.from(buffer));
          console.log(`  ✓ Downloaded image from storage: ${filename}`);
          return `../../assets/articles/${filename}`;
        }
      } catch (err) {
        console.warn(`  ⚠ Error processing storage path for ${slug}: ${err.message}`);
        return null;
      }
    }

    return null;
  } catch (err) {
    console.warn(`  ⚠ Error downloading image for ${slug}: ${err.message}`);
    return null;
  }
}

function escapeYaml(str) {
  // Escape quotes in YAML strings
  if (!str) return '';
  if (str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

function generateMarkdown(article, imageRelativePath) {
  const frontmatter = `---
title: ${escapeYaml(article.title)}
excerpt: ${escapeYaml(article.excerpt)}
date: ${article.date}
category: ${escapeYaml(article.category)}
tags: []
${article.author ? `author: ${escapeYaml(article.author)}` : ''}
${imageRelativePath ? `image: ${imageRelativePath}` : ''}
featured: ${article.featured ? 'true' : 'false'}
---

${article.content || article.excerpt || ''}
`;

  return frontmatter;
}

async function exportArticles() {
  console.log('📥 Starting article export from Stackbase...\n');

  try {
    // Fetch all published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true);

    if (error) {
      console.error('❌ Error fetching articles:', error);
      process.exit(1);
    }

    if (!articles || articles.length === 0) {
      console.warn('⚠ No articles found in Stackbase');
      process.exit(0);
    }

    console.log(`Found ${articles.length} articles to export\n`);

    let exported = 0;
    let failed = 0;

    for (const article of articles) {
      try {
        console.log(`Processing: ${article.title} (${article.slug})`);

        // Download image if present
        let imageRelativePath = null;
        if (article.image) {
          imageRelativePath = await downloadImage(article.image, article.slug);
        }

        // Generate Markdown file
        const markdown = generateMarkdown(article, imageRelativePath);
        const filepath = path.join(CONTENT_DIR, `${article.slug}.md`);

        fs.writeFileSync(filepath, markdown);
        console.log(`  ✓ Created markdown file\n`);

        exported++;
      } catch (err) {
        console.error(`  ❌ Error processing article: ${err.message}\n`);
        failed++;
      }
    }

    console.log(`\n✅ Export complete!`);
    console.log(`   Exported: ${exported}/${articles.length}`);
    if (failed > 0) {
      console.log(`   Failed: ${failed}`);
    }
    console.log(`   Location: ${path.resolve(CONTENT_DIR)}`);
    console.log(`   Images: ${path.resolve(ASSETS_DIR)}`);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

exportArticles();
