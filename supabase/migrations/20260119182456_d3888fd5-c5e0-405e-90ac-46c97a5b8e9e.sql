-- Add API key columns to payment_methods table for storing gateway credentials
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS api_secret TEXT;

COMMENT ON COLUMN payment_methods.api_key IS 'Public API key (Stripe publishable key, Razorpay key_id)';
COMMENT ON COLUMN payment_methods.api_secret IS 'Secret API key (encrypted in UI display)';