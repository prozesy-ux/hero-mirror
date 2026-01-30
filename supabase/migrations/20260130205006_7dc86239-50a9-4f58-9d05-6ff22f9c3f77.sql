-- Add guest email support to seller_orders for guest checkout
ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS guest_email TEXT DEFAULT NULL;

-- Create index for efficient guest order lookups
CREATE INDEX IF NOT EXISTS idx_seller_orders_guest_email ON seller_orders(guest_email) WHERE guest_email IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN seller_orders.guest_email IS 'Email address for guest (unauthenticated) purchases';