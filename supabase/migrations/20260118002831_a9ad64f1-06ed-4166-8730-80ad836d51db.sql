-- Fix function search path for update_seller_trust_score
CREATE OR REPLACE FUNCTION update_seller_trust_score(p_seller_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_orders INTEGER;
  v_approved_orders INTEGER;
  v_total_reports INTEGER;
  v_resolved_reports INTEGER;
  v_score INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE buyer_approved = true)
  INTO v_total_orders, v_approved_orders
  FROM seller_orders WHERE seller_id = p_seller_id AND status = 'completed';

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'resolved')
  INTO v_total_reports, v_resolved_reports
  FROM seller_reports WHERE seller_id = p_seller_id;

  v_score := 100;
  IF v_total_orders > 0 THEN
    v_score := v_score + ((v_approved_orders::float / v_total_orders::float) * 10)::integer;
  END IF;
  IF v_total_reports > 0 THEN
    v_score := v_score - ((v_total_reports - v_resolved_reports) * 5);
  END IF;
  v_score := GREATEST(0, LEAST(100, v_score));

  INSERT INTO seller_trust_scores (seller_id, trust_score, total_reports, resolved_reports, successful_orders, buyer_approved_count, last_calculated)
  VALUES (p_seller_id, v_score, v_total_reports, v_resolved_reports, v_total_orders, v_approved_orders, now())
  ON CONFLICT (seller_id) DO UPDATE SET
    trust_score = EXCLUDED.trust_score, total_reports = EXCLUDED.total_reports,
    resolved_reports = EXCLUDED.resolved_reports, successful_orders = EXCLUDED.successful_orders,
    buyer_approved_count = EXCLUDED.buyer_approved_count, last_calculated = now();
END;
$$;

-- Fix function search path for approve_seller_delivery
CREATE OR REPLACE FUNCTION approve_seller_delivery(p_order_id UUID, p_buyer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM seller_orders WHERE id = p_order_id AND buyer_id = p_buyer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status != 'delivered' THEN RAISE EXCEPTION 'Order must be delivered'; END IF;

  UPDATE seller_orders SET status = 'completed', buyer_approved = true WHERE id = p_order_id;
  UPDATE seller_wallets SET balance = balance + v_order.seller_earning, pending_balance = pending_balance - v_order.seller_earning, updated_at = now() WHERE seller_id = v_order.seller_id;
  PERFORM update_seller_trust_score(v_order.seller_id);
END;
$$;