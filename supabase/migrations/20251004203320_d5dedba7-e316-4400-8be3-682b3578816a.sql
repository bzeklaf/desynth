-- Harden profiles table RLS policies to explicitly restrict email access
-- This addresses the security finding: User Email Addresses Exposed to All Authenticated Users

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with explicit role restrictions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate SELECT policy with explicit authenticated role restriction
-- This ensures only authenticated users can query profiles, and only their own
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Recreate INSERT policy with explicit authenticated role restriction
-- This ensures users can only create their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Recreate UPDATE policy with explicit authenticated role restriction
-- This ensures users can only update their own profile (including email)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- No DELETE policy - users should not be able to delete their profiles
-- (profile deletion should be handled through auth.users deletion with CASCADE)

-- Additional security notes:
-- 1. Email addresses are only accessible to the profile owner due to auth.uid() = user_id check
-- 2. No anonymous access is possible - all policies require authenticated role
-- 3. No enumeration is possible - users cannot query other users' profiles
-- 4. Application code should never expose profile emails to other users