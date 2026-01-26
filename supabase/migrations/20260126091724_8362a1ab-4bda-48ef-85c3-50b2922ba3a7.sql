-- Add country column to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS country text DEFAULT 'BD';

-- Add country column to seller_payment_accounts
ALTER TABLE public.seller_payment_accounts 
ADD COLUMN IF NOT EXISTS country text DEFAULT 'BD';

-- Add account_details column for additional data (like IFSC, network, etc.)
ALTER TABLE public.seller_payment_accounts 
ADD COLUMN IF NOT EXISTS account_details jsonb DEFAULT '{}'::jsonb;