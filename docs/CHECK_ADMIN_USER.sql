-- Check if admin user exists in Supabase
-- Run this in Supabase SQL Editor

-- 1. Check auth.users table
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'valentin.fourtune@gmail.com';

-- 2. Check profiles table
SELECT id, role, display_name, created_at
FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'valentin.fourtune@gmail.com'
);

-- 3. Count all users
SELECT COUNT(*) as total_users FROM auth.users;

-- 4. Count all admin users
SELECT COUNT(*) as admin_count FROM profiles WHERE role = 'admin';
