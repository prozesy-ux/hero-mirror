-- Create storage bucket for prompt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-images', 'prompt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to prompt images
CREATE POLICY "Public can view prompt images"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-images');

-- Allow admins to upload prompt images
CREATE POLICY "Admins can upload prompt images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update prompt images
CREATE POLICY "Admins can update prompt images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prompt-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete prompt images
CREATE POLICY "Admins can delete prompt images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);