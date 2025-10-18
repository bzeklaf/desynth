-- Add foreign key constraint from facilities.owner_user_id to profiles.user_id
ALTER TABLE public.facilities
ADD CONSTRAINT facilities_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;