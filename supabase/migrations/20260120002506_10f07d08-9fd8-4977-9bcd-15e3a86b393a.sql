-- Performance indexes for faster dashboard queries

-- Seller orders: faster order filtering by seller and status
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_status 
ON public.seller_orders (seller_id, status);

-- Seller orders: faster buyer lookups
CREATE INDEX IF NOT EXISTS idx_seller_orders_buyer_id 
ON public.seller_orders (buyer_id);

-- Prompts: faster category and featured filtering
CREATE INDEX IF NOT EXISTS idx_prompts_category_featured 
ON public.prompts (category_id, is_featured);

-- Prompts: faster trending lookups
CREATE INDEX IF NOT EXISTS idx_prompts_trending 
ON public.prompts (is_trending) WHERE is_trending = true;

-- Notifications: faster user notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, is_read);

-- AI accounts: faster category and availability filtering
CREATE INDEX IF NOT EXISTS idx_ai_accounts_category_available 
ON public.ai_accounts (category_id, is_available);

-- Seller products: faster approved product lookups
CREATE INDEX IF NOT EXISTS idx_seller_products_approved_available 
ON public.seller_products (is_approved, is_available);

-- Seller products: faster seller product lookups
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_id 
ON public.seller_products (seller_id);

-- Favorites: faster user favorite lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id 
ON public.favorites (user_id);

-- Wallet transactions: faster user transaction history
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created 
ON public.wallet_transactions (user_id, created_at DESC);

-- Support messages: faster unread count queries
CREATE INDEX IF NOT EXISTS idx_support_messages_user_read 
ON public.support_messages (user_id, is_read);

-- Categories: faster active category lookups
CREATE INDEX IF NOT EXISTS idx_categories_active_order 
ON public.categories (is_active, display_order);