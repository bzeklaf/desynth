-- Create trigger to automatically create profile on user signup (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users who don't have profiles
INSERT INTO public.profiles (user_id, role, first_name, last_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'role', 'buyer')::user_role,
  au.raw_user_meta_data ->> 'first_name',
  au.raw_user_meta_data ->> 'last_name',
  au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;