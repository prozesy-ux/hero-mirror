-- Create secure public view for payment methods (excludes api_key and api_secret)
CREATE OR REPLACE VIEW public.payment_methods_public AS
SELECT 
  id, 
  name, 
  code, 
  icon_url, 
  qr_image_url, 
  account_number, 
  account_name,
  instructions, 
  is_automatic, 
  is_enabled, 
  display_order, 
  currency_code, 
  exchange_rate, 
  withdrawal_enabled, 
  min_withdrawal, 
  max_withdrawal, 
  created_at
FROM public.payment_methods
WHERE is_enabled = true;

-- Grant select access on the view
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;

-- Create rate_limits table for admin login rate limiting if not exists
CREATE TABLE IF NOT EXISTS public.admin_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on IP for upsert
CREATE UNIQUE INDEX IF NOT EXISTS admin_rate_limits_ip_idx ON public.admin_rate_limits(ip_address);

-- Function to check rate limit (called by edge function)
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(p_ip_address TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record admin_rate_limits%ROWTYPE;
  v_blocked BOOLEAN := false;
  v_attempts INTEGER := 0;
BEGIN
  -- Clean old entries (older than 1 hour)
  DELETE FROM admin_rate_limits WHERE first_attempt_at < NOW() - INTERVAL '1 hour' AND blocked_until IS NULL;
  DELETE FROM admin_rate_limits WHERE blocked_until IS NOT NULL AND blocked_until < NOW();
  
  -- Get or create record
  SELECT * INTO v_record FROM admin_rate_limits WHERE ip_address = p_ip_address;
  
  IF v_record.id IS NULL THEN
    -- First attempt
    INSERT INTO admin_rate_limits (ip_address) VALUES (p_ip_address)
    RETURNING * INTO v_record;
  ELSE
    -- Check if blocked
    IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > NOW() THEN
      RETURN json_build_object('blocked', true, 'blocked_until', v_record.blocked_until);
    END IF;
    
    -- Increment attempts
    v_attempts := v_record.attempt_count + 1;
    
    -- Block after 5 attempts
    IF v_attempts >= 5 THEN
      UPDATE admin_rate_limits 
      SET attempt_count = v_attempts, blocked_until = NOW() + INTERVAL '15 minutes'
      WHERE id = v_record.id;
      RETURN json_build_object('blocked', true, 'blocked_until', NOW() + INTERVAL '15 minutes');
    ELSE
      UPDATE admin_rate_limits SET attempt_count = v_attempts WHERE id = v_record.id;
    END IF;
  END IF;
  
  RETURN json_build_object('blocked', false, 'attempts', COALESCE(v_attempts, 1));
END;
$$;

-- Function to reset rate limit on successful login
CREATE OR REPLACE FUNCTION public.reset_admin_rate_limit(p_ip_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM admin_rate_limits WHERE ip_address = p_ip_address;
END;
$$;