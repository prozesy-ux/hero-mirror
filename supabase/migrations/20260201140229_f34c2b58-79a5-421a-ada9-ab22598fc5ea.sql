-- Add product_type column to seller_products
ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital_product';

-- Add product_type specific metadata (JSON for flexibility)
ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS product_metadata JSONB DEFAULT '{}';

-- Create index for product type filtering
CREATE INDEX IF NOT EXISTS idx_seller_products_type ON seller_products(product_type);

-- Update existing products to default type
UPDATE seller_products SET product_type = 'digital_product' WHERE product_type IS NULL;