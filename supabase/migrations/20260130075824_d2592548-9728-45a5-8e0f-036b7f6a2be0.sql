-- Fix search_path for newly created functions
CREATE OR REPLACE FUNCTION public.generate_product_slug(product_name TEXT, p_seller_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  base_slug := LOWER(TRIM(product_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'product';
  END IF;
  
  base_slug := LEFT(base_slug, 80);
  final_slug := base_slug;
  
  LOOP
    IF p_seller_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM public.seller_products WHERE slug = final_slug AND seller_id = p_seller_id) INTO slug_exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM public.ai_accounts WHERE slug = final_slug) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'seller_products' THEN
      NEW.slug := public.generate_product_slug(NEW.name, NEW.seller_id);
    ELSE
      NEW.slug := public.generate_product_slug(NEW.name, NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;