-- Add INSERT policy for seller_notifications
-- This allows authenticated users to create notifications for sellers (e.g., when buying products)
CREATE POLICY "Authenticated users can insert seller notifications"
  ON public.seller_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);