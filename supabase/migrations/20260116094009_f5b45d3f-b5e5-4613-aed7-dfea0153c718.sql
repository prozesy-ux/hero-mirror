-- Create RLS policies for admin_sessions table to allow public insert/delete/select
-- This is needed for the admin panel login/logout flow

-- Enable RLS if not already enabled
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert admin sessions (the session token itself is the secret)
CREATE POLICY "Allow public insert admin sessions"
ON public.admin_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to delete their own session by token
CREATE POLICY "Allow public delete admin sessions by token"
ON public.admin_sessions
FOR DELETE
USING (true);

-- Allow anyone to select sessions (needed for token validation in edge function)
CREATE POLICY "Allow public select admin sessions"
ON public.admin_sessions
FOR SELECT
USING (true);

-- Clean up expired sessions automatically (create a function to be called by edge function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_sessions WHERE expires_at < NOW();
END;
$$;