
-- Create store_designs table for custom store builder
CREATE TABLE public.store_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  theme_preset text DEFAULT 'minimal-white',
  global_styles jsonb DEFAULT '{"primaryColor": "#000000", "secondaryColor": "#ffffff", "backgroundColor": "#ffffff", "textColor": "#000000", "fontFamily": "Inter"}'::jsonb,
  sections jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

-- Enable RLS
ALTER TABLE public.store_designs ENABLE ROW LEVEL SECURITY;

-- Sellers can read/write their own designs
CREATE POLICY "Sellers can view their own designs"
  ON public.store_designs FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can insert their own designs"
  ON public.store_designs FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update their own designs"
  ON public.store_designs FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
    )
  );

-- Public can read active designs (for store page rendering)
CREATE POLICY "Public can view active designs"
  ON public.store_designs FOR SELECT
  TO anon
  USING (is_active = true);

-- Also allow authenticated users to read active designs (for store visitors)
CREATE POLICY "Authenticated can view active designs"
  ON public.store_designs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Auto-update updated_at
CREATE TRIGGER update_store_designs_updated_at
  BEFORE UPDATE ON public.store_designs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
