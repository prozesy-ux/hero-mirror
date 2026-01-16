-- Create admin_credentials table for custom admin login
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- No direct access - only via edge function with service role
CREATE POLICY "No direct access to admin credentials" ON public.admin_credentials
  FOR ALL USING (false);

-- Install pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the admin credential with hashed password
INSERT INTO public.admin_credentials (username, password_hash)
VALUES ('ProZesy', crypt('ProMeida@18177', gen_salt('bf')))
ON CONFLICT (username) DO UPDATE SET password_hash = crypt('ProMeida@18177', gen_salt('bf'));