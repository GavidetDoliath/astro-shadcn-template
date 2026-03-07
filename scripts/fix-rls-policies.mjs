import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const fixRLSPolicies = async () => {
  try {
    console.log('🔗 Connecting to Supabase...\n');

    console.log('🔧 Fixing RLS policies for infinite recursion...\n');

    const sqlScript = `
-- Drop the problematic policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create helper function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies
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
`;

    // Use Supabase SQL API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ query: sqlScript }),
    });

    if (response.ok) {
      console.log('✅ SQL executed successfully\n');
    } else {
      const error = await response.json();
      console.error('⚠️  Response:', error);
      console.log('\n📋 Paste this SQL into Supabase SQL Editor manually:\n');
      console.log(sqlScript);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Paste this SQL into Supabase SQL Editor manually:\n');
    const sqlScript = `
-- Drop the problematic policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create helper function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies
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
`;
    console.log(sqlScript);
  }
};

fixRLSPolicies();
