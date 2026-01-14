-- Drop the admin-only policy on prompts
DROP POLICY IF EXISTS "Admins can manage prompts" ON prompts;

-- Create a policy that allows all operations (admin panel protected by frontend)
CREATE POLICY "Allow all prompt management"
ON prompts FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing restrictive storage policies
DROP POLICY IF EXISTS "Admins can manage prompt images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete prompt images" ON storage.objects;

-- Allow uploads to prompt-images bucket
CREATE POLICY "Allow prompt image uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prompt-images');

-- Allow updates to prompt-images bucket
CREATE POLICY "Allow prompt image updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prompt-images');

-- Allow deletes from prompt-images bucket
CREATE POLICY "Allow prompt image deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'prompt-images');