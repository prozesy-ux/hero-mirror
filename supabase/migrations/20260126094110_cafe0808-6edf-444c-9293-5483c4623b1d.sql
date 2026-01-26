-- Create user 2FA settings table
CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  secret_key TEXT,
  recovery_codes TEXT[],
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create seller 2FA settings table
CREATE TABLE IF NOT EXISTS public.seller_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  secret_key TEXT,
  recovery_codes TEXT[],
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create withdrawal OTPs table
CREATE TABLE IF NOT EXISTS public.withdrawal_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE CASCADE NOT NULL,
  withdrawal_amount NUMERIC NOT NULL,
  payment_account_id UUID NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_otps ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_2fa_settings
CREATE POLICY "Users can view own 2FA settings" ON public.user_2fa_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON public.user_2fa_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings" ON public.user_2fa_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for seller_2fa_settings
CREATE POLICY "Sellers can view own 2FA settings" ON public.seller_2fa_settings
  FOR SELECT USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can update own 2FA settings" ON public.seller_2fa_settings
  FOR UPDATE USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can insert own 2FA settings" ON public.seller_2fa_settings
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- RLS policies for withdrawal_otps (no direct access, handled by edge functions)
CREATE POLICY "No direct access to withdrawal OTPs" ON public.withdrawal_otps
  FOR ALL USING (false);