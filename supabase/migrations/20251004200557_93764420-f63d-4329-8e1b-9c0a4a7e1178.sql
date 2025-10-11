-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view approved facilities" ON public.facilities;

-- Create policy requiring authentication for basic facility viewing
CREATE POLICY "Authenticated users can view approved facilities"
ON public.facilities
FOR SELECT
TO authenticated
USING (status = 'approved'::facility_status);

-- Admins and facility owners already have full access through existing policies
-- Application layer should filter sensitive data (reputation_score, qa_pass_rate, etc.)
-- for users who don't own the facility or have bookings with it