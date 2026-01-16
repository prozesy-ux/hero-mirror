-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Set admin username
UPDATE public.profiles 
SET username = 'ProZesy' 
WHERE email = 'mdmerajul614@gmail.com';