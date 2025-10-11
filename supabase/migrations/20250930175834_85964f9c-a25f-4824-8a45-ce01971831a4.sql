-- Fix slot data exposure by restricting SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.slots;

CREATE POLICY "Authenticated users can view available slots"
ON public.slots
FOR SELECT
TO authenticated
USING (is_available = true);

-- Also ensure facility owners can still manage their slots (this policy should already exist but let's be explicit)
-- The existing "Facility owners can manage their slots" policy handles INSERT, UPDATE, DELETE