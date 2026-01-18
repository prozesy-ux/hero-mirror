-- Add email requirement columns to seller_products and seller_orders
ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS requires_email BOOLEAN DEFAULT false;

ALTER TABLE seller_orders 
ADD COLUMN IF NOT EXISTS buyer_email_input TEXT;

-- Add comment for clarity
COMMENT ON COLUMN seller_products.requires_email IS 'When true, buyer must provide their email for shared access products';
COMMENT ON COLUMN seller_orders.buyer_email_input IS 'Email provided by buyer for products that require email access';