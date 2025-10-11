-- Restrict facilities SELECT to authenticated users without dropping policy
ALTER POLICY "Anyone can view approved facilities"
ON public.facilities
TO authenticated;