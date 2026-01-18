-- Create function to add to seller pending balance
CREATE OR REPLACE FUNCTION public.add_seller_pending_balance(
  p_seller_id UUID,
  p_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE seller_wallets
  SET pending_balance = pending_balance + p_amount,
      updated_at = NOW()
  WHERE seller_id = p_seller_id;
END;
$$;