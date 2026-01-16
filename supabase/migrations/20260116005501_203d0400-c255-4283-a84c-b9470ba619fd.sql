-- Add trending flag to prompts
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- Add QR image URL to payment methods
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS qr_image_url TEXT;