-- Create click tracking RPC function
CREATE OR REPLACE FUNCTION increment_product_click(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO product_analytics (product_id, date, views, clicks, purchases, revenue)
  VALUES (p_product_id, CURRENT_DATE, 0, 1, 0, 0)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET clicks = product_analytics.clicks + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function to sync orders to analytics
CREATE OR REPLACE FUNCTION sync_order_to_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_analytics (product_id, date, views, clicks, purchases, revenue)
  VALUES (NEW.product_id, CURRENT_DATE, 0, 0, 1, NEW.amount)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET 
    purchases = product_analytics.purchases + 1,
    revenue = product_analytics.revenue + NEW.amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on seller_orders
DROP TRIGGER IF EXISTS trigger_sync_order_analytics ON seller_orders;
CREATE TRIGGER trigger_sync_order_analytics
AFTER INSERT ON seller_orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_to_analytics();

-- Backfill historical data from existing orders
INSERT INTO product_analytics (product_id, date, views, clicks, purchases, revenue)
SELECT 
  product_id,
  DATE(created_at) as date,
  0 as views,
  0 as clicks,
  COUNT(*) as purchases,
  COALESCE(SUM(amount), 0) as revenue
FROM seller_orders
WHERE status IN ('completed', 'delivered') AND product_id IS NOT NULL
GROUP BY product_id, DATE(created_at)
ON CONFLICT (product_id, date) 
DO UPDATE SET 
  purchases = EXCLUDED.purchases,
  revenue = EXCLUDED.revenue;