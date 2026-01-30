-- Add product_type column to seller_products
ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'other';

-- Create index for filtering by type
CREATE INDEX IF NOT EXISTS idx_seller_products_type 
ON seller_products(product_type) WHERE is_available = true;

-- Add type-specific metadata column (JSON for flexible attributes)
ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS type_metadata JSONB DEFAULT '{}';