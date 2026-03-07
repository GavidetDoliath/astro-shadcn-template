-- PHASE 1: Setup Database in Supabase
-- Execute these queries in Supabase SQL Editor (https://app.supabase.com/project/[YOUR_PROJECT]/sql)
-- Run each section in order

-- ============================================================================
-- SECTION 1: Create ENUM types
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'redacteur', 'subscriber_paid', 'subscriber_free');
CREATE TYPE newsletter_status AS ENUM ('pending', 'confirmed', 'unsubscribed');

-- ============================================================================
-- SECTION 2: Create profiles table (extends auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'subscriber_free',
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_subscription_status TEXT,
  subscription_current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- ============================================================================
-- SECTION 3: Auto-create profile on user signup (trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_app_meta_data->>'role', 'subscriber_free')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 4: Auto-update updated_at on profile changes
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SECTION 5: Create newsletter_subscriptions table
-- ============================================================================

CREATE TABLE newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status newsletter_status NOT NULL DEFAULT 'pending',
  confirmation_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_status ON newsletter_subscriptions(status);
CREATE INDEX idx_newsletter_token ON newsletter_subscriptions(confirmation_token);

-- ============================================================================
-- SECTION 6: Modify articles table (add access_level and author_id)
-- ============================================================================

ALTER TABLE articles
  ADD COLUMN access_level TEXT NOT NULL DEFAULT 'public'
    CHECK (access_level IN ('public', 'subscriber_free', 'subscriber_paid')),
  ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_articles_access_level ON articles(access_level);
CREATE INDEX idx_articles_author_id ON articles(author_id);

-- ============================================================================
-- SECTION 7: Enable RLS on all tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 8: RLS Policies for profiles table
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users can update their own non-role fields
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins can update any profile (including role)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Service role can insert (via trigger)
-- No explicit policy needed - RLS doesn't apply to SECURITY DEFINER functions

-- ============================================================================
-- SECTION 9: RLS Policies for articles table
-- ============================================================================

-- Public can read public published articles
CREATE POLICY "articles_select_public"
  ON articles FOR SELECT
  USING (
    published = true
    AND access_level = 'public'
  );

-- Authenticated users can read subscriber_free articles
CREATE POLICY "articles_select_subscriber_free"
  ON articles FOR SELECT
  USING (
    published = true
    AND access_level IN ('public', 'subscriber_free')
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('subscriber_free', 'subscriber_paid', 'redacteur', 'admin')
    )
  );

-- Paid subscribers can read subscriber_paid articles
CREATE POLICY "articles_select_subscriber_paid"
  ON articles FOR SELECT
  USING (
    published = true
    AND access_level IN ('public', 'subscriber_free', 'subscriber_paid')
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('subscriber_paid', 'admin')
    )
  );

-- Redacteurs and admins can read all their own articles (including drafts)
CREATE POLICY "articles_select_redacteur_own"
  ON articles FOR SELECT
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('redacteur', 'admin')
    )
  );

-- Admins can read everything
CREATE POLICY "articles_select_admin"
  ON articles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Redacteurs can insert new articles (they become the author)
CREATE POLICY "articles_insert_redacteur"
  ON articles FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('redacteur', 'admin')
    )
  );

-- Redacteurs can update only their own articles
CREATE POLICY "articles_update_redacteur"
  ON articles FOR UPDATE
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('redacteur', 'admin')
    )
  );

-- Admins can update any article
CREATE POLICY "articles_update_admin"
  ON articles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Redacteurs can delete only their own articles
CREATE POLICY "articles_delete_redacteur"
  ON articles FOR DELETE
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('redacteur', 'admin')
    )
  );

-- Admins can delete any article
CREATE POLICY "articles_delete_admin"
  ON articles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- SECTION 10: RLS Policies for newsletter_subscriptions table
-- ============================================================================

-- Admins can read all newsletter subscriptions
CREATE POLICY "newsletter_select_admin"
  ON newsletter_subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Service role handles all newsletter operations via API (no SELECT by users)

-- ============================================================================
-- SECTION 11: Insert existing admin user profile
-- ============================================================================

INSERT INTO profiles (id, role, display_name)
SELECT id, 'admin', email FROM auth.users WHERE email = 'valentin.fourtune@gmail.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verify everything is set up
-- ============================================================================

-- Check profiles table has the admin user
SELECT id, role, display_name FROM profiles LIMIT 5;

-- Check articles table has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'articles' AND column_name IN ('access_level', 'author_id');
