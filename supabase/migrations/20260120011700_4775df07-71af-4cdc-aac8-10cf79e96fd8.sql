-- Add RLS policy for admin_rate_limits table
-- Only service role (edge functions) can access this table via SECURITY DEFINER functions

-- No public policies needed - the functions use SECURITY DEFINER
-- Create a restrictive default policy that blocks all direct access
CREATE POLICY "No direct public access" ON public.admin_rate_limits
  FOR ALL USING (false);