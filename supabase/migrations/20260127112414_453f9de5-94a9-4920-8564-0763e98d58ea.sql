-- Add country column to profiles table for buyer country detection
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BD';

-- Enable realtime for withdrawal_method_config table to allow live sync with wallets
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_method_config;