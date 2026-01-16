-- Enable pgcrypto extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update the password hash using the extensions schema
UPDATE public.admin_credentials 
SET password_hash = extensions.crypt('ProMeida@18177', extensions.gen_salt('bf'))
WHERE username = 'ProZesy';

-- Recreate the verify function using extensions schema
CREATE OR REPLACE FUNCTION public.verify_admin_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_credentials
  WHERE username = p_username;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = extensions.crypt(p_password, stored_hash);
END;
$$;