-- Create function to verify admin password using plpgsql
CREATE OR REPLACE FUNCTION public.verify_admin_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  RETURN stored_hash = crypt(p_password, stored_hash);
END;
$$;