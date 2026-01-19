-- Create atomic AI account purchase function (prevents race conditions and double-spending)
CREATE OR REPLACE FUNCTION public.purchase_ai_account(
  p_user_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_account_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance NUMERIC;
  v_purchase_id UUID;
BEGIN
  -- Lock wallet row for update to prevent race conditions
  SELECT balance INTO v_balance
  FROM user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No wallet found');
  END IF;
  
  -- Check sufficient balance
  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds', 'current_balance', v_balance);
  END IF;
  
  -- Atomically update balance
  UPDATE user_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (p_user_id, 'purchase', p_amount, 'completed', 'AI Account: ' || p_account_name);
  
  -- Create purchase record
  INSERT INTO ai_account_purchases (user_id, ai_account_id, amount, payment_status, delivery_status)
  VALUES (p_user_id, p_account_id, p_amount, 'completed', 'pending')
  RETURNING id INTO v_purchase_id;
  
  RETURN json_build_object(
    'success', true, 
    'purchase_id', v_purchase_id, 
    'new_balance', v_balance - p_amount
  );
END;
$$;

-- Create atomic seller product purchase function
CREATE OR REPLACE FUNCTION public.purchase_seller_product(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid,
  p_amount numeric,
  p_seller_earning numeric,
  p_product_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance NUMERIC;
  v_order_id UUID;
BEGIN
  -- Lock buyer wallet row for update
  SELECT balance INTO v_balance
  FROM user_wallets
  WHERE user_id = p_buyer_id
  FOR UPDATE;
  
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No wallet found');
  END IF;
  
  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds', 'current_balance', v_balance);
  END IF;
  
  -- Deduct from buyer wallet
  UPDATE user_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_buyer_id;
  
  -- Create buyer transaction record
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (p_buyer_id, 'purchase', p_amount, 'completed', 'Product: ' || p_product_name);
  
  -- Add to seller pending balance
  UPDATE seller_wallets
  SET pending_balance = pending_balance + p_seller_earning, updated_at = now()
  WHERE seller_id = p_seller_id;
  
  -- Create order record
  INSERT INTO seller_orders (buyer_id, seller_id, product_id, amount, seller_earning, status)
  VALUES (p_buyer_id, p_seller_id, p_product_id, p_amount, p_seller_earning, 'pending')
  RETURNING id INTO v_order_id;
  
  RETURN json_build_object(
    'success', true, 
    'order_id', v_order_id, 
    'new_balance', v_balance - p_amount
  );
END;
$$;