-- Fix security issues from linter

-- 1. Drop and recreate view WITHOUT security definer (default is SECURITY INVOKER)
DROP VIEW IF EXISTS public.payment_methods_public;

CREATE VIEW public.payment_methods_public 
WITH (security_invoker = true)
AS
SELECT 
  id, 
  name, 
  code, 
  icon_url, 
  qr_image_url, 
  account_number, 
  account_name,
  instructions, 
  is_automatic, 
  is_enabled, 
  display_order, 
  currency_code, 
  exchange_rate, 
  withdrawal_enabled, 
  min_withdrawal, 
  max_withdrawal, 
  created_at
FROM public.payment_methods
WHERE is_enabled = true;

-- Grant select access on the view
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;

-- 2. Enable RLS on admin_rate_limits table
ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (via service role) to access the table - no public access
-- Note: The check/reset functions use SECURITY DEFINER so they bypass RLS