-- Add content column to articles table (if not already present)
-- Run this in Supabase SQL Editor

ALTER TABLE articles ADD COLUMN IF NOT EXISTS content TEXT;

-- Verify column was added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'articles' AND column_name = 'content';
