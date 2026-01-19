-- Add images array column for multi-image support
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';