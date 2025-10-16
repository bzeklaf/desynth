-- Create missing triggers on auth.users to ensure profiles and roles are created
-- and backfill existing users so current accounts can log in without instant logout.

-- Create trigger for profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- Create trigger for user_roles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_role'
  ) THEN
    CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user_role();
  END IF;
END $$;

-- Backfill profiles for existing users without a profile
INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
SELECT u.id,
       u.email,
       u.raw_user_meta_data ->> 'first_name' AS first_name,
       u.raw_user_meta_data ->> 'last_name'  AS last_name,
       COALESCE(u.raw_user_meta_data ->> 'role', 'buyer')::user_role AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Backfill user_roles for existing users without a role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       COALESCE(u.raw_user_meta_data ->> 'role', 'buyer')::user_role AS role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;
