-- Add display settings columns to seller_profiles
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS banner_height TEXT DEFAULT 'medium';
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS show_reviews BOOLEAN DEFAULT true;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS show_product_count BOOLEAN DEFAULT true;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS show_order_count BOOLEAN DEFAULT true;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS show_description BOOLEAN DEFAULT true;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true;

-- Add constraint for banner_height values
ALTER TABLE seller_profiles DROP CONSTRAINT IF EXISTS seller_profiles_banner_height_check;
ALTER TABLE seller_profiles ADD CONSTRAINT seller_profiles_banner_height_check CHECK (banner_height IN ('small', 'medium', 'large'));