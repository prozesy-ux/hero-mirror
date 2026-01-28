-- Fix overly permissive RLS on product_analytics
-- Drop the too-permissive policy
DROP POLICY IF EXISTS "System can manage analytics" ON public.product_analytics;

-- Create more specific policies
CREATE POLICY "Service role can manage analytics"
ON public.product_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to increment views on any product (for tracking)
CREATE POLICY "Authenticated can insert analytics"
ON public.product_analytics FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Sellers can update own product analytics"
ON public.product_analytics FOR UPDATE
USING (product_id IN (
  SELECT id FROM public.seller_products 
  WHERE seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid())
));