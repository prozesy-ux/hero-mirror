-- Add stripe_session_id column to seller_orders for idempotency
ALTER TABLE public.seller_orders 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Create unique index to prevent duplicate orders from same session
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_orders_stripe_session 
ON public.seller_orders(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;