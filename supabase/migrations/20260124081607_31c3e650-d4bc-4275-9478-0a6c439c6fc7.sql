-- Create atomic function for Pro plan purchase with wallet deduction
CREATE OR REPLACE FUNCTION public.purchase_pro_plan(
  p_user_id UUID,
  p_amount NUMERIC DEFAULT 19.00
)
RETURNS JSON
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
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient funds', 
      'current_balance', v_balance,
      'required', p_amount
    );
  END IF;
  
  -- Atomically update wallet balance
  UPDATE user_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES (p_user_id, 'purchase', p_amount, 'completed', 'Pro Plan Upgrade');
  
  -- Create purchase record
  INSERT INTO purchases (user_id, amount, payment_status)
  VALUES (p_user_id, p_amount, 'completed')
  RETURNING id INTO v_purchase_id;
  
  -- Update profile to Pro
  UPDATE profiles
  SET is_pro = true, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'purchase_id', v_purchase_id, 
    'new_balance', v_balance - p_amount
  );
END;
$$;