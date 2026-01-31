-- Add payment_gateway and gateway_transaction_id columns to seller_orders if not exists
ALTER TABLE public.seller_orders 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;

-- Create unique index on gateway_transaction_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_orders_gateway_txn 
ON public.seller_orders(gateway_transaction_id) 
WHERE gateway_transaction_id IS NOT NULL;

-- Create guest_pending_orders table for manual payment approvals
CREATE TABLE IF NOT EXISTS public.guest_pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  seller_id UUID,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  user_id UUID,
  order_id UUID
);

-- Enable RLS
ALTER TABLE public.guest_pending_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (via service role)
-- No public access - only edge functions with service role can access
CREATE POLICY "Service role only access"
ON public.guest_pending_orders
FOR ALL
USING (false)
WITH CHECK (false);

-- Create indexes for admin lookups
CREATE INDEX IF NOT EXISTS idx_guest_pending_orders_status ON public.guest_pending_orders(status);
CREATE INDEX IF NOT EXISTS idx_guest_pending_orders_email ON public.guest_pending_orders(email);
CREATE INDEX IF NOT EXISTS idx_guest_pending_orders_created ON public.guest_pending_orders(created_at DESC);

-- Create unique index on transaction_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_pending_orders_txn 
ON public.guest_pending_orders(transaction_id) 
WHERE transaction_id IS NOT NULL;