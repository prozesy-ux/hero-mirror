-- =====================================================
-- ENTERPRISE DASHBOARD EXPANSION - NEW TABLES
-- =====================================================

-- 1. Traffic analytics for sellers
CREATE TABLE IF NOT EXISTS public.seller_traffic_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  source TEXT DEFAULT 'direct', -- 'direct', 'organic', 'social', 'referral'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for seller_traffic_analytics
ALTER TABLE public.seller_traffic_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own traffic analytics"
ON public.seller_traffic_analytics FOR SELECT
USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all traffic analytics"
ON public.seller_traffic_analytics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Buyer wishlist
CREATE TABLE IF NOT EXISTS public.buyer_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT DEFAULT 'seller', -- 'seller' or 'ai_account'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, product_type)
);

-- RLS for buyer_wishlist
ALTER TABLE public.buyer_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
ON public.buyer_wishlist FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wishlists"
ON public.buyer_wishlist FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Discount codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
  value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE CASCADE, -- NULL for platform-wide
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discount codes"
ON public.discount_codes FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Sellers can manage own discount codes"
ON public.discount_codes FOR ALL
USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all discount codes"
ON public.discount_codes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Admin audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to audit logs"
ON public.admin_audit_logs FOR ALL
USING (false);

-- 5. Platform announcements
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  target_audience TEXT DEFAULT 'all', -- 'all', 'buyers', 'sellers'
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for platform_announcements
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
ON public.platform_announcements FOR SELECT
USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "No direct insert/update for announcements"
ON public.platform_announcements FOR ALL
USING (false);

-- 6. Recently viewed products
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT DEFAULT 'seller', -- 'seller' or 'ai_account'
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for recently_viewed
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recently viewed"
ON public.recently_viewed FOR ALL
USING (auth.uid() = user_id);

-- 7. Platform settings (for admin)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  maintenance_mode BOOLEAN DEFAULT false,
  registration_enabled BOOLEAN DEFAULT true,
  seller_registration_enabled BOOLEAN DEFAULT true,
  min_withdrawal_amount NUMERIC DEFAULT 10,
  platform_fee_percentage NUMERIC DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- RLS for platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY "No direct update for platform settings"
ON public.platform_settings FOR ALL
USING (false);

-- Insert default platform settings
INSERT INTO public.platform_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_traffic_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_wishlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recently_viewed;