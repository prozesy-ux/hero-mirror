-- Add soft delete columns to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add withdrawal settings to payment_methods
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_withdrawal NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_withdrawal NUMERIC DEFAULT 1000;

-- Create seller_payment_accounts table for saved withdrawal accounts
CREATE TABLE IF NOT EXISTS public.seller_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  payment_method_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  account_details JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(seller_id, payment_method_code, account_number)
);

-- Enable RLS on seller_payment_accounts
ALTER TABLE public.seller_payment_accounts ENABLE ROW LEVEL SECURITY;

-- Seller can view their own accounts
CREATE POLICY "Sellers can view own payment accounts" 
ON public.seller_payment_accounts 
FOR SELECT 
USING (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));

-- Seller can insert their own accounts
CREATE POLICY "Sellers can insert own payment accounts" 
ON public.seller_payment_accounts 
FOR INSERT 
WITH CHECK (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));

-- Seller can update their own accounts
CREATE POLICY "Sellers can update own payment accounts" 
ON public.seller_payment_accounts 
FOR UPDATE 
USING (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));

-- Seller can delete their own accounts
CREATE POLICY "Sellers can delete own payment accounts" 
ON public.seller_payment_accounts 
FOR DELETE 
USING (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));

-- Add payment_account_id to seller_withdrawals
ALTER TABLE public.seller_withdrawals
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES public.seller_payment_accounts(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_seller_payment_accounts_seller_id ON public.seller_payment_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_is_deleted ON public.seller_profiles(is_deleted);

-- Enable realtime for seller_payment_accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_payment_accounts;