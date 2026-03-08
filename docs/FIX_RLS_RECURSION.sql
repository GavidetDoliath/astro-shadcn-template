-- FIX: RLS Infinite Recursion in profiles table
-- Execute this SQL in Supabase SQL Editor if you get:
-- "infinite recursion detected in policy for relation "profiles""
--
-- Cause: The admin-check policies were querying the profiles table
-- while RLS was enabled on that same table, creating circular dependencies.
--
-- Solution: Use SECURITY DEFINER function to bypass RLS for admin checks

-- Drop the problematic policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create helper function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the safe function
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (
    SELECT role FROM profiles WHERE id = auth.uid()
  )
);

-- Verify the fix
SELECT COUNT(*) FROM profiles;
