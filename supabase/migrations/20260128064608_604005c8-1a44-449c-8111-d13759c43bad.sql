-- =============================================
-- PHASE 1: SELLER LEVEL SYSTEM, FLASH SALES, PRODUCT ANALYTICS
-- =============================================

-- 1. SELLER LEVELS TABLE
CREATE TABLE public.seller_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'New', 'Rising', 'Established', 'Top', 'Elite'
  badge_color text NOT NULL DEFAULT '#6B7280',
  badge_icon text DEFAULT 'star',
  min_orders integer DEFAULT 0,
  min_rating numeric DEFAULT 0,
  min_revenue numeric DEFAULT 0,
  commission_rate numeric DEFAULT 10,
  benefits jsonb DEFAULT '[]'::jsonb,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can view seller levels
CREATE POLICY "Anyone can view seller levels"
ON public.seller_levels FOR SELECT
USING (true);

-- Only admins can manage seller levels
CREATE POLICY "Admins can manage seller levels"
ON public.seller_levels FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default seller levels
INSERT INTO public.seller_levels (name, badge_color, badge_icon, min_orders, min_rating, min_revenue, commission_rate, benefits, display_order) VALUES
('New Seller', '#9CA3AF', 'user', 0, 0, 0, 12, '["Basic support", "Standard visibility"]', 1),
('Rising Seller', '#3B82F6', 'trending-up', 10, 3.5, 100, 10, '["Priority support", "Enhanced visibility", "Flash sales access"]', 2),
('Established', '#8B5CF6', 'award', 50, 4.0, 500, 8, '["Premium support", "Featured placement", "Advanced analytics"]', 3),
('Top Seller', '#F59E0B', 'crown', 200, 4.5, 2000, 6, '["VIP support", "Homepage featured", "Unlimited flash sales", "Custom storefront"]', 4),
('Elite', '#EF4444', 'gem', 500, 4.8, 10000, 5, '["Dedicated manager", "Priority featuring", "Exclusive badges", "Lowest fees"]', 5);

-- Add level_id to seller_profiles
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS level_id uuid REFERENCES public.seller_levels(id);

-- Set default level for existing sellers
UPDATE public.seller_profiles 
SET level_id = (SELECT id FROM public.seller_levels WHERE name = 'New Seller' LIMIT 1)
WHERE level_id IS NULL;

-- 2. FLASH SALES TABLE
CREATE TABLE public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.seller_products(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE CASCADE NOT NULL,
  discount_percentage numeric NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 90),
  original_price numeric NOT NULL,
  sale_price numeric NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  max_quantity integer,
  sold_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Anyone can view active flash sales
CREATE POLICY "Anyone can view active flash sales"
ON public.flash_sales FOR SELECT
USING (is_active = true AND starts_at <= now() AND ends_at > now());

-- Sellers can manage their own flash sales
CREATE POLICY "Sellers can manage own flash sales"
ON public.flash_sales FOR ALL
USING (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));

-- Admins can manage all flash sales
CREATE POLICY "Admins can manage all flash sales"
ON public.flash_sales FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_flash_sales_active ON public.flash_sales(is_active, starts_at, ends_at);
CREATE INDEX idx_flash_sales_product ON public.flash_sales(product_id);

-- 3. PRODUCT ANALYTICS TABLE
CREATE TABLE public.product_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.seller_products(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  purchases integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  UNIQUE(product_id, date)
);

-- Enable RLS
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own product analytics
CREATE POLICY "Sellers can view own product analytics"
ON public.product_analytics FOR SELECT
USING (product_id IN (
  SELECT id FROM public.seller_products 
  WHERE seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid())
));

-- System can insert/update analytics (via edge function)
CREATE POLICY "System can manage analytics"
ON public.product_analytics FOR ALL
USING (true)
WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.product_analytics FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_product_analytics_product_date ON public.product_analytics(product_id, date);

-- 4. FUNCTION TO UPDATE SELLER LEVEL BASED ON PERFORMANCE
CREATE OR REPLACE FUNCTION public.update_seller_level(p_seller_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_orders integer;
  v_avg_rating numeric;
  v_total_revenue numeric;
  v_new_level_id uuid;
BEGIN
  -- Get seller metrics
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO v_total_orders, v_total_revenue
  FROM seller_orders
  WHERE seller_id = p_seller_id AND status = 'completed';

  -- Get average rating
  SELECT COALESCE(AVG(rating), 0)
  INTO v_avg_rating
  FROM product_reviews pr
  JOIN seller_products sp ON pr.product_id = sp.id
  WHERE sp.seller_id = p_seller_id;

  -- Find appropriate level
  SELECT id INTO v_new_level_id
  FROM seller_levels
  WHERE min_orders <= v_total_orders
    AND min_rating <= v_avg_rating
    AND min_revenue <= v_total_revenue
  ORDER BY display_order DESC
  LIMIT 1;

  -- Update seller level
  IF v_new_level_id IS NOT NULL THEN
    UPDATE seller_profiles
    SET level_id = v_new_level_id
    WHERE id = p_seller_id;
  END IF;
END;
$$;

-- 5. FUNCTION TO INCREMENT PRODUCT VIEWS
CREATE OR REPLACE FUNCTION public.increment_product_view(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO product_analytics (product_id, date, views)
  VALUES (p_product_id, CURRENT_DATE, 1)
  ON CONFLICT (product_id, date)
  DO UPDATE SET views = product_analytics.views + 1;
END;
$$;

-- 6. FUNCTION TO GET ACTIVE FLASH SALE FOR PRODUCT
CREATE OR REPLACE FUNCTION public.get_active_flash_sale(p_product_id uuid)
RETURNS TABLE (
  id uuid,
  discount_percentage numeric,
  original_price numeric,
  sale_price numeric,
  ends_at timestamp with time zone,
  max_quantity integer,
  sold_quantity integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fs.id,
    fs.discount_percentage,
    fs.original_price,
    fs.sale_price,
    fs.ends_at,
    fs.max_quantity,
    fs.sold_quantity
  FROM flash_sales fs
  WHERE fs.product_id = p_product_id
    AND fs.is_active = true
    AND fs.starts_at <= now()
    AND fs.ends_at > now()
    AND (fs.max_quantity IS NULL OR fs.sold_quantity < fs.max_quantity)
  LIMIT 1;
$$;

-- Enable realtime for flash_sales
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_sales;