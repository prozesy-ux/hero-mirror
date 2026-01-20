-- Index for faster store page loading by store_slug
CREATE INDEX IF NOT EXISTS idx_seller_profiles_store_slug_active 
ON seller_profiles(store_slug) 
WHERE is_active = true;