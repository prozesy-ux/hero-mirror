-- Add 2FA enabled flag to seller profiles (default: true for security)
ALTER TABLE seller_profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT true;

-- Add 2FA enabled flag to user profiles (default: true for security)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT true;

-- Create user OTP table for sensitive profile actions
CREATE TABLE IF NOT EXISTS user_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_otps ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_otps
CREATE POLICY "No direct access to user_otps" ON user_otps
FOR ALL USING (false);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_otps_user_action ON user_otps(user_id, action_type, verified);