-- Create buyer withdrawal OTPs table
CREATE TABLE IF NOT EXISTS public.buyer_withdrawal_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  withdrawal_amount NUMERIC NOT NULL,
  payment_account_id UUID NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_withdrawal_otps ENABLE ROW LEVEL SECURITY;

-- No direct access - only via edge functions
CREATE POLICY "No direct access to buyer OTPs" ON public.buyer_withdrawal_otps
  FOR ALL USING (false);