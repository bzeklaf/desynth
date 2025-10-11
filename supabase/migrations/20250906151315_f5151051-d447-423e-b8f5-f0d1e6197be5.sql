-- Update the handle_new_user function to properly extract role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'buyer')::user_role
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles that might have incorrect roles
-- This will set the role based on any role data in their metadata, defaulting to 'buyer'
UPDATE public.profiles 
SET role = COALESCE(
  (SELECT raw_user_meta_data ->> 'role' FROM auth.users WHERE id = profiles.user_id), 
  'buyer'
)::user_role
WHERE role = 'buyer';