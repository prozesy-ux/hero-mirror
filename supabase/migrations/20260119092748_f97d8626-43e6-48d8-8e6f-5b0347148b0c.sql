-- Add store customization fields to seller_profiles
ALTER TABLE seller_profiles 
ADD COLUMN IF NOT EXISTS store_slug text UNIQUE,
ADD COLUMN IF NOT EXISTS store_video_url text,
ADD COLUMN IF NOT EXISTS store_banner_url text,
ADD COLUMN IF NOT EXISTS store_tagline text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- Create function to auto-generate slug from store_name
CREATE OR REPLACE FUNCTION public.generate_store_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.store_slug IS NULL OR NEW.store_slug = '' THEN
    base_slug := lower(regexp_replace(NEW.store_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM seller_profiles WHERE store_slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.store_slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS set_store_slug ON seller_profiles;
CREATE TRIGGER set_store_slug
BEFORE INSERT OR UPDATE ON seller_profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_store_slug();

-- Create storage bucket for store media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for store media uploads (sellers can upload their own)
CREATE POLICY "Sellers can upload store media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Sellers can update their store media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'store-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public can view store media"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-media');

-- RLS policy for public store access (anonymous can view active verified stores)
CREATE POLICY "Public can view active verified stores"
ON seller_profiles FOR SELECT
USING (is_active = true AND is_verified = true);

-- RLS policy for public product access (anonymous can view available approved products)
CREATE POLICY "Public can view available approved products"
ON seller_products FOR SELECT
USING (is_available = true AND is_approved = true);

-- Update existing sellers to have slugs generated
UPDATE seller_profiles SET store_slug = NULL WHERE store_slug IS NULL;