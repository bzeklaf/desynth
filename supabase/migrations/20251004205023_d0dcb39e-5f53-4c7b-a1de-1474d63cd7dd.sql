-- Add explicit anonymous user blocking for profiles table
-- This is a defense-in-depth measure to ensure no anonymous access

-- Create a RESTRICTIVE policy that requires authentication for all SELECT operations
-- RESTRICTIVE policies must pass in addition to PERMISSIVE policies
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Also block anonymous access to resale_listings if marketplace should be auth-only
-- Note: Comment this out if you want public marketplace viewing
CREATE POLICY "Block anonymous access to listings"
ON public.resale_listings
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Add explicit block for bookings to prevent any anonymous access
CREATE POLICY "Block anonymous access to bookings"
ON public.bookings
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);