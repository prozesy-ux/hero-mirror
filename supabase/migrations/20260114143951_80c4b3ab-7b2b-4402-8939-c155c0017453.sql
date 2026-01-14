
-- =============================================
-- SECURITY FIX: Remove all overly permissive RLS policies
-- and replace with proper admin-only access
-- =============================================

-- 1. FIX PROMPTS TABLE
-- Drop the dangerous "Allow all" policy
DROP POLICY IF EXISTS "Allow all prompt management" ON public.prompts;

-- Create admin-only policies for write operations
CREATE POLICY "Admins can insert prompts"
ON public.prompts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompts"
ON public.prompts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete prompts"
ON public.prompts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. FIX AI_ACCOUNTS TABLE
DROP POLICY IF EXISTS "Allow all AI accounts management" ON public.ai_accounts;

CREATE POLICY "Admins can insert ai_accounts"
ON public.ai_accounts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ai_accounts"
ON public.ai_accounts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ai_accounts"
ON public.ai_accounts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. FIX AI_ACCOUNT_PURCHASES TABLE
DROP POLICY IF EXISTS "Allow all AI account purchases management" ON public.ai_account_purchases;

-- Admins can view all purchases
CREATE POLICY "Admins can view all ai_account_purchases"
ON public.ai_account_purchases
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update purchases (for delivering credentials)
CREATE POLICY "Admins can update ai_account_purchases"
ON public.ai_account_purchases
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can delete purchases
CREATE POLICY "Admins can delete ai_account_purchases"
ON public.ai_account_purchases
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 4. FIX CANCELLATION_REQUESTS TABLE
DROP POLICY IF EXISTS "Allow all cancellation requests management" ON public.cancellation_requests;

-- Admins can view all cancellation requests
CREATE POLICY "Admins can view all cancellation_requests"
ON public.cancellation_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update cancellation requests
CREATE POLICY "Admins can update cancellation_requests"
ON public.cancellation_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can delete cancellation requests
CREATE POLICY "Admins can delete cancellation_requests"
ON public.cancellation_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 5. FIX REFUND_REQUESTS TABLE
DROP POLICY IF EXISTS "Allow all refund requests management" ON public.refund_requests;

-- Admins can view all refund requests
CREATE POLICY "Admins can view all refund_requests"
ON public.refund_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update refund requests
CREATE POLICY "Admins can update refund_requests"
ON public.refund_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can delete refund requests
CREATE POLICY "Admins can delete refund_requests"
ON public.refund_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 6. FIX STORAGE POLICIES FOR PROMPT-IMAGES BUCKET
DROP POLICY IF EXISTS "Allow all prompt-images management" ON storage.objects;

-- Public can view prompt images
CREATE POLICY "Anyone can view prompt-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'prompt-images');

-- Only admins can upload prompt images
CREATE POLICY "Admins can insert prompt-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prompt-images' AND has_role(auth.uid(), 'admin'));

-- Only admins can update prompt images
CREATE POLICY "Admins can update prompt-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'prompt-images' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'prompt-images' AND has_role(auth.uid(), 'admin'));

-- Only admins can delete prompt images
CREATE POLICY "Admins can delete prompt-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'prompt-images' AND has_role(auth.uid(), 'admin'));
