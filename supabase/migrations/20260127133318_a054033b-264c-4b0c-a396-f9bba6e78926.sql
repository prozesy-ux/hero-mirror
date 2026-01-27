-- Allow authenticated users to read enabled withdrawal methods
CREATE POLICY "Authenticated users can read enabled withdrawal config"
ON public.withdrawal_method_config
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_enabled = true
);