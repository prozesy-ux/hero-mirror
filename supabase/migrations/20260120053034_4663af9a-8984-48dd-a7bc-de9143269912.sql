-- 1. Fix the approve_seller_delivery function to prevent negative pending balance
CREATE OR REPLACE FUNCTION public.approve_seller_delivery(p_order_id uuid, p_buyer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM seller_orders WHERE id = p_order_id AND buyer_id = p_buyer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status != 'delivered' THEN RAISE EXCEPTION 'Order must be delivered'; END IF;

  UPDATE seller_orders SET status = 'completed', buyer_approved = true WHERE id = p_order_id;
  
  -- Use GREATEST to prevent negative pending balance
  UPDATE seller_wallets SET 
    balance = balance + v_order.seller_earning, 
    pending_balance = GREATEST(0, pending_balance - v_order.seller_earning), 
    updated_at = now() 
  WHERE seller_id = v_order.seller_id;
  
  PERFORM update_seller_trust_score(v_order.seller_id);
END;
$function$;

-- 2. Fix corrupted historical data - recalculate all pending balances
UPDATE seller_wallets sw
SET pending_balance = COALESCE((
  SELECT SUM(seller_earning) 
  FROM seller_orders so 
  WHERE so.seller_id = sw.seller_id 
  AND so.status IN ('pending', 'delivered')
), 0),
updated_at = now();