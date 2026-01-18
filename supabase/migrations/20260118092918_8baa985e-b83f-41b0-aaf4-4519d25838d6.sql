-- Function to check if product should be auto-approved
CREATE OR REPLACE FUNCTION public.auto_approve_new_product()
RETURNS TRIGGER AS $$
DECLARE
  v_auto_approve_all BOOLEAN;
  v_auto_approve_verified_only BOOLEAN;
  v_seller_verified BOOLEAN;
  v_seller_auto_approve BOOLEAN;
BEGIN
  -- Get global settings
  SELECT auto_approve_all, auto_approve_verified_only 
  INTO v_auto_approve_all, v_auto_approve_verified_only
  FROM public.auto_approval_settings 
  WHERE id = 'global'
  LIMIT 1;
  
  -- Get seller settings
  SELECT is_verified, auto_approve_products
  INTO v_seller_verified, v_seller_auto_approve
  FROM public.seller_profiles
  WHERE id = NEW.seller_id;
  
  -- Check auto-approval conditions
  IF v_auto_approve_all = true THEN
    NEW.is_approved := true;
  ELSIF v_auto_approve_verified_only = true AND v_seller_verified = true THEN
    NEW.is_approved := true;
  ELSIF v_seller_auto_approve = true THEN
    NEW.is_approved := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on product insert
CREATE TRIGGER trigger_auto_approve_product
BEFORE INSERT ON public.seller_products
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_new_product();