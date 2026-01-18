-- Create seller feature requests table
CREATE TABLE public.seller_feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create auto approval settings table
CREATE TABLE public.auto_approval_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  auto_approve_all BOOLEAN DEFAULT false,
  auto_approve_verified_only BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Add auto_approve_products column to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS auto_approve_products BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.seller_feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_approval_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller_feature_requests
CREATE POLICY "Admins can manage all feature requests" 
ON public.seller_feature_requests FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view own feature requests" 
ON public.seller_feature_requests FOR SELECT 
USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can create feature requests" 
ON public.seller_feature_requests FOR INSERT 
WITH CHECK (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- RLS policies for auto_approval_settings
CREATE POLICY "Admins can manage auto approval settings" 
ON public.auto_approval_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view auto approval settings" 
ON public.auto_approval_settings FOR SELECT 
USING (true);

-- Enable realtime for feature requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_feature_requests;

-- Insert default auto approval settings
INSERT INTO public.auto_approval_settings (id, auto_approve_all, auto_approve_verified_only) 
VALUES ('global', false, false)
ON CONFLICT (id) DO NOTHING;