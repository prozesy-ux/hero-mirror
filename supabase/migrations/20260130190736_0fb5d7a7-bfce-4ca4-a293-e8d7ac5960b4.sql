-- Add slug column to seller_products
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index per seller (only on non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS seller_products_seller_slug_unique 
ON seller_products(seller_id, slug) 
WHERE slug IS NOT NULL;

-- Create function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Only generate if name changed or slug is null
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;

  -- Generate base slug from name
  base_slug := LOWER(TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^\w\s-]', '', 'g'),
        '[\s_-]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  ));
  
  -- Limit length
  base_slug := LEFT(base_slug, 50);
  final_slug := base_slug;
  
  -- Check for uniqueness within seller, append number if needed
  WHILE EXISTS (
    SELECT 1 FROM seller_products 
    WHERE seller_id = NEW.seller_id 
    AND slug = final_slug 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-slug generation
DROP TRIGGER IF EXISTS set_product_slug ON seller_products;
CREATE TRIGGER set_product_slug
BEFORE INSERT OR UPDATE OF name ON seller_products
FOR EACH ROW EXECUTE FUNCTION generate_product_slug();

-- Backfill existing products with slugs (trigger will handle uniqueness)
UPDATE seller_products SET slug = NULL WHERE slug IS NULL;
UPDATE seller_products SET name = name WHERE slug IS NULL;