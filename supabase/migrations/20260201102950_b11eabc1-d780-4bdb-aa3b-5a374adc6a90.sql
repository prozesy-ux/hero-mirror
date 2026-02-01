-- =====================================================
-- Performance Indexes for High-Traffic Tables
-- =====================================================

-- Enable pg_trgm extension if not already enabled (for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================
-- seller_orders
-- ===================

-- Buyer dashboard: ORDER BY created_at DESC with buyer_id filter
CREATE INDEX IF NOT EXISTS idx_seller_orders_buyer_created 
ON seller_orders (buyer_id, created_at DESC);

-- Seller dashboard: ORDER BY created_at DESC with seller_id filter
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_created 
ON seller_orders (seller_id, created_at DESC);

-- Hot products: completed orders in date range grouped by product
CREATE INDEX IF NOT EXISTS idx_seller_orders_completed_recent 
ON seller_orders (created_at DESC, product_id) 
WHERE status = 'completed';

-- Product analytics aggregations
CREATE INDEX IF NOT EXISTS idx_seller_orders_product_id 
ON seller_orders (product_id);

-- ===================
-- wallet_transactions
-- ===================

-- Admin dashboard filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status_type 
ON wallet_transactions (status, type);

-- Pending transactions lookup
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_pending 
ON wallet_transactions (user_id, created_at DESC) 
WHERE status = 'pending';

-- ===================
-- recently_viewed (Critical - 100% seq scans currently!)
-- ===================

-- User's recently viewed products
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_viewed 
ON recently_viewed (user_id, viewed_at DESC);

-- Product lookups
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product 
ON recently_viewed (product_id, product_type);

-- ===================
-- seller_profiles (Search optimization)
-- ===================

-- Fuzzy search on store name
CREATE INDEX IF NOT EXISTS idx_seller_profiles_store_name_trgm 
ON seller_profiles USING gin (store_name gin_trgm_ops);

-- Verified & active sellers (partial index)
CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified_active 
ON seller_profiles (id) 
WHERE is_verified = true AND is_active = true;

-- ===================
-- popular_searches
-- ===================

-- Trending searches ordered by count
CREATE INDEX IF NOT EXISTS idx_popular_searches_count_desc 
ON popular_searches (search_count DESC);