-- Migration: Create newspaper_editions table
-- Run this in Supabase SQL Editor to set up the newspaper system

CREATE TABLE IF NOT EXISTS newspaper_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'chicago-sentinel',
  format TEXT NOT NULL DEFAULT 'A4',
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready')),
  pages JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newspaper_editions_date
  ON newspaper_editions(date DESC);

CREATE INDEX IF NOT EXISTS idx_newspaper_editions_created_by
  ON newspaper_editions(created_by);

-- Enable RLS (Row-Level Security)
ALTER TABLE newspaper_editions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all editions
CREATE POLICY "admin_can_read_all_editions"
  ON newspaper_editions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Admins can insert editions
CREATE POLICY "admin_can_insert_editions"
  ON newspaper_editions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Admins can update editions
CREATE POLICY "admin_can_update_editions"
  ON newspaper_editions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Admins can delete editions
CREATE POLICY "admin_can_delete_editions"
  ON newspaper_editions FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');
