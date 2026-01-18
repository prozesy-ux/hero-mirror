-- Add buyer_approved column to seller_orders
ALTER TABLE public.seller_orders
ADD COLUMN IF NOT EXISTS buyer_approved boolean DEFAULT false;

-- Create seller_reports table for buyer reports on sellers
CREATE TABLE IF NOT EXISTS public.seller_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  order_id UUID,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seller_trust_scores table
CREATE TABLE IF NOT EXISTS public.seller_trust_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL UNIQUE,
  trust_score INTEGER DEFAULT 100,
  total_reports INTEGER DEFAULT 0,
  resolved_reports INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  buyer_approved_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_trust_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller_reports
CREATE POLICY "Admins can manage all reports"
ON public.seller_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyers can create reports"
ON public.seller_reports FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can view own reports"
ON public.seller_reports FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view reports about them"
ON public.seller_reports FOR SELECT
USING (EXISTS (
  SELECT 1 FROM seller_profiles
  WHERE seller_profiles.id = seller_reports.seller_id
  AND seller_profiles.user_id = auth.uid()
));

-- RLS policies for seller_trust_scores
CREATE POLICY "Admins can manage trust scores"
ON public.seller_trust_scores FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view own trust score"
ON public.seller_trust_scores FOR SELECT
USING (EXISTS (
  SELECT 1 FROM seller_profiles
  WHERE seller_profiles.id = seller_trust_scores.seller_id
  AND seller_profiles.user_id = auth.uid()
));

CREATE POLICY "Public can view trust scores"
ON public.seller_trust_scores FOR SELECT
USING (true);

-- Function to update trust score
CREATE OR REPLACE FUNCTION update_seller_trust_score(p_seller_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_orders INTEGER;
  v_approved_orders INTEGER;
  v_total_reports INTEGER;
  v_resolved_reports INTEGER;
  v_score INTEGER;
BEGIN
  -- Get order stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE buyer_approved = true)
  INTO v_total_orders, v_approved_orders
  FROM seller_orders
  WHERE seller_id = p_seller_id AND status = 'completed';

  -- Get report stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'resolved')
  INTO v_total_reports, v_resolved_reports
  FROM seller_reports
  WHERE seller_id = p_seller_id;

  -- Calculate score (base 100, deduct for reports, add for approvals)
  v_score := 100;
  IF v_total_orders > 0 THEN
    v_score := v_score + ((v_approved_orders::float / v_total_orders::float) * 10)::integer;
  END IF;
  IF v_total_reports > 0 THEN
    v_score := v_score - ((v_total_reports - v_resolved_reports) * 5);
  END IF;
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Upsert trust score
  INSERT INTO seller_trust_scores (seller_id, trust_score, total_reports, resolved_reports, successful_orders, buyer_approved_count, last_calculated)
  VALUES (p_seller_id, v_score, v_total_reports, v_resolved_reports, v_total_orders, v_approved_orders, now())
  ON CONFLICT (seller_id) DO UPDATE SET
    trust_score = EXCLUDED.trust_score,
    total_reports = EXCLUDED.total_reports,
    resolved_reports = EXCLUDED.resolved_reports,
    successful_orders = EXCLUDED.successful_orders,
    buyer_approved_count = EXCLUDED.buyer_approved_count,
    last_calculated = now();
END;
$$;

-- Function to approve delivery and move balance
CREATE OR REPLACE FUNCTION approve_seller_delivery(p_order_id UUID, p_buyer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM seller_orders WHERE id = p_order_id AND buyer_id = p_buyer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or unauthorized';
  END IF;
  
  IF v_order.status != 'delivered' THEN
    RAISE EXCEPTION 'Order must be in delivered status';
  END IF;

  -- Update order status
  UPDATE seller_orders SET 
    status = 'completed',
    buyer_approved = true
  WHERE id = p_order_id;

  -- Move from pending to available balance
  UPDATE seller_wallets SET
    balance = balance + v_order.seller_earning,
    pending_balance = pending_balance - v_order.seller_earning,
    updated_at = now()
  WHERE seller_id = v_order.seller_id;

  -- Update trust score
  PERFORM update_seller_trust_score(v_order.seller_id);
END;
$$;

-- Add realtime for seller_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_reports;