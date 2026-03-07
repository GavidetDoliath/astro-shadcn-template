#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const { PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupTable() {
  try {
    console.log('📋 Setting up articles table...\n');

    // Create table using raw SQL
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          excerpt TEXT,
          date DATE NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('lettre', 'pamphlet', 'fosse')),
          image TEXT,
          slug TEXT NOT NULL UNIQUE,
          author TEXT,
          linkedinUrl TEXT,
          featured BOOLEAN DEFAULT false,
          published BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);
        CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
        CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
      `
    });

    if (error && !error.message.includes('already exists')) {
      console.error('❌ Error creating table:', error);
      console.log('\n⚠️  Falling back: trying alternative approach...');

      // Alternative: Just check if table exists
      const { data, error: checkError } = await supabase
        .from('articles')
        .select('count(*)', { count: 'exact', head: true });

      if (checkError && checkError.code === 'PGRST116') {
        console.error('❌ Table does not exist. Please create it manually:');
        console.error(`
        CREATE TABLE articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          excerpt TEXT,
          date DATE NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('lettre', 'pamphlet', 'fosse')),
          image TEXT,
          slug TEXT NOT NULL UNIQUE,
          author TEXT,
          linkedinUrl TEXT,
          featured BOOLEAN DEFAULT false,
          published BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );
        `);
        process.exit(1);
      }

      console.log('✅ Table exists, continuing...');
    } else {
      console.log('✅ Table created or already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTable();
