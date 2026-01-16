-- Add admin_id column to admin_sessions table
ALTER TABLE public.admin_sessions 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.admin_credentials(id);

-- Update existing sessions to link to the admin (optional cleanup)
UPDATE public.admin_sessions 
SET admin_id = (SELECT id FROM public.admin_credentials WHERE username = 'ProZesy' LIMIT 1)
WHERE admin_id IS NULL;