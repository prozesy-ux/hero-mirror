-- Add slug column to seller_products
ALTER TABLE seller_products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add slug column to ai_accounts
ALTER TABLE ai_accounts
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create slug generation function
CREATE OR REPLACE FUNCTION generate_product_slug(product_name TEXT, seller_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Generate base slug from name
  base_slug := LOWER(TRIM(product_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Limit length to 80 characters
  base_slug := LEFT(base_slug, 80);
  
  -- Handle empty slug
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'product';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness (per seller for seller_products)
  LOOP
    IF seller_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM seller_products sp
        WHERE sp.slug = final_slug AND sp.seller_id = generate_product_slug.seller_id
      ) INTO slug_exists;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM ai_accounts WHERE slug = final_slug
      ) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing seller products
UPDATE seller_products 
SET slug = generate_product_slug(name, seller_id)
WHERE slug IS NULL;

-- Generate slugs for existing AI accounts
UPDATE ai_accounts 
SET slug = generate_product_slug(name, NULL)
WHERE slug IS NULL;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_products_seller_slug 
ON seller_products(seller_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_accounts_slug 
ON ai_accounts(slug);

-- Make slug NOT NULL after populating (with default for safety)
ALTER TABLE seller_products ALTER COLUMN slug SET DEFAULT '';
ALTER TABLE seller_products ALTER COLUMN slug SET NOT NULL;

ALTER TABLE ai_accounts ALTER COLUMN slug SET DEFAULT '';
ALTER TABLE ai_accounts ALTER COLUMN slug SET NOT NULL;

-- Create trigger for auto-generating slugs on insert
CREATE OR REPLACE FUNCTION auto_generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'seller_products' THEN
      NEW.slug := generate_product_slug(NEW.name, NEW.seller_id);
    ELSE
      NEW.slug := generate_product_slug(NEW.name, NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_seller_products_auto_slug ON seller_products;
CREATE TRIGGER tr_seller_products_auto_slug
BEFORE INSERT ON seller_products
FOR EACH ROW EXECUTE FUNCTION auto_generate_product_slug();

DROP TRIGGER IF EXISTS tr_ai_accounts_auto_slug ON ai_accounts;
CREATE TRIGGER tr_ai_accounts_auto_slug
BEFORE INSERT ON ai_accounts
FOR EACH ROW EXECUTE FUNCTION auto_generate_product_slug();