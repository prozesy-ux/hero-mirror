-- Function to increment view count atomically for seller products
CREATE OR REPLACE FUNCTION public.increment_seller_product_view(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE seller_products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_product_id;
  
  -- Also update product_analytics
  INSERT INTO product_analytics (product_id, date, views)
  VALUES (p_product_id, CURRENT_DATE, 1)
  ON CONFLICT (product_id, date)
  DO UPDATE SET views = product_analytics.views + 1;
END;
$$;

-- Function to increment ai_account view count
CREATE OR REPLACE FUNCTION public.increment_ai_account_view(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE ai_accounts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_account_id;
END;
$$;