-- 1. Create atomic purchase function to prevent race conditions
CREATE OR REPLACE FUNCTION public.purchase_ai_account(
  p_user_id UUID,
  p_account_id UUID,
  p_amount NUMERIC,
  p_account_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 2. Add constraint to prevent negative wallet balance
ALTER TABLE user_wallets DROP CONSTRAINT IF EXISTS balance_non_negative;
ALTER TABLE user_wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- 3. Add RLS policy to block anonymous access to profiles
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 4. Grant execute permission on the purchase function
GRANT EXECUTE ON FUNCTION public.purchase_ai_account TO authenticated;