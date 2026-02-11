
-- ============================================
-- Auto-Delivery System: Tables & Policies
-- ============================================

-- 1. delivery_pool_items: Stores accounts, license keys, unique downloads
CREATE TABLE public.delivery_pool_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('account', 'license_key', 'download')),
  label text,
  credentials jsonb NOT NULL DEFAULT '{}',
  is_assigned boolean NOT NULL DEFAULT false,
  assigned_to uuid,
  assigned_order_id uuid REFERENCES public.seller_orders(id),
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  display_order integer NOT NULL DEFAULT 0
);

-- Indexes for fast lookup
CREATE INDEX idx_delivery_pool_product ON public.delivery_pool_items(product_id, is_assigned);
CREATE INDEX idx_delivery_pool_seller ON public.delivery_pool_items(seller_id);
CREATE INDEX idx_delivery_pool_assigned_to ON public.delivery_pool_items(assigned_to) WHERE assigned_to IS NOT NULL;

-- RLS
ALTER TABLE public.delivery_pool_items ENABLE ROW LEVEL SECURITY;

-- Sellers can view/manage their own pool items
CREATE POLICY "Sellers can view own pool items"
  ON public.delivery_pool_items FOR SELECT
  TO authenticated
  USING (public.is_seller(auth.uid()) AND seller_id IN (
    SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sellers can insert own pool items"
  ON public.delivery_pool_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_seller(auth.uid()) AND seller_id IN (
    SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sellers can update own pool items"
  ON public.delivery_pool_items FOR UPDATE
  TO authenticated
  USING (public.is_seller(auth.uid()) AND seller_id IN (
    SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sellers can delete own unassigned pool items"
  ON public.delivery_pool_items FOR DELETE
  TO authenticated
  USING (public.is_seller(auth.uid()) AND is_assigned = false AND seller_id IN (
    SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()
  ));

-- 2. buyer_delivered_items: Records what was delivered to each buyer
CREATE TABLE public.buyer_delivered_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  order_id uuid REFERENCES public.seller_orders(id),
  product_id uuid NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  delivery_type text NOT NULL CHECK (delivery_type IN ('account', 'license_key', 'download', 'files')),
  delivered_data jsonb NOT NULL DEFAULT '{}',
  delivered_at timestamptz NOT NULL DEFAULT now(),
  is_revealed boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_buyer_delivered_buyer ON public.buyer_delivered_items(buyer_id);
CREATE INDEX idx_buyer_delivered_order ON public.buyer_delivered_items(order_id);

-- RLS
ALTER TABLE public.buyer_delivered_items ENABLE ROW LEVEL SECURITY;

-- Buyers can only view their own delivered items
CREATE POLICY "Buyers can view own delivered items"
  ON public.buyer_delivered_items FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Buyers can update is_revealed on their own items
CREATE POLICY "Buyers can reveal own items"
  ON public.buyer_delivered_items FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- 3. Function to sync product stock with available pool items
CREATE OR REPLACE FUNCTION public.sync_delivery_pool_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the product stock to match available (unassigned) pool items
  UPDATE seller_products
  SET stock = (
    SELECT COUNT(*) FROM delivery_pool_items
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_assigned = false
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-sync stock when pool items change
CREATE TRIGGER sync_stock_on_pool_change
AFTER INSERT OR UPDATE OR DELETE ON public.delivery_pool_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_delivery_pool_stock();

-- 4. Function for atomic auto-delivery assignment (called from edge function via RPC)
CREATE OR REPLACE FUNCTION public.assign_delivery_pool_item(
  p_product_id uuid,
  p_buyer_id uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_remaining integer;
BEGIN
  -- Lock and claim the next available item
  SELECT * INTO v_item
  FROM delivery_pool_items
  WHERE product_id = p_product_id
    AND is_assigned = false
  ORDER BY display_order, created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No items available in pool');
  END IF;

  -- Mark as assigned
  UPDATE delivery_pool_items
  SET is_assigned = true,
      assigned_to = p_buyer_id,
      assigned_order_id = p_order_id,
      assigned_at = now()
  WHERE id = v_item.id;

  -- Insert into buyer_delivered_items
  INSERT INTO buyer_delivered_items (buyer_id, order_id, product_id, delivery_type, delivered_data)
  VALUES (p_buyer_id, p_order_id, p_product_id, v_item.item_type, v_item.credentials);

  -- Check remaining stock
  SELECT COUNT(*) INTO v_remaining
  FROM delivery_pool_items
  WHERE product_id = p_product_id AND is_assigned = false;

  -- If pool empty, mark product unavailable
  IF v_remaining = 0 THEN
    UPDATE seller_products SET is_available = false WHERE id = p_product_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item.id,
    'item_type', v_item.item_type,
    'credentials', v_item.credentials,
    'remaining', v_remaining
  );
END;
$$;
