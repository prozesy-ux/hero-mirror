-- AI Accounts for sale
CREATE TABLE public.ai_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 5.00,
  icon_url TEXT,
  category TEXT DEFAULT 'chatgpt',
  is_available BOOLEAN DEFAULT true,
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Account Purchases
CREATE TABLE public.ai_account_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ai_account_id UUID NOT NULL REFERENCES public.ai_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  account_credentials TEXT,
  delivery_status TEXT DEFAULT 'pending',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- Refund Requests
CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID,
  purchase_type TEXT NOT NULL DEFAULT 'pro_plan',
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Cancellation Requests
CREATE TABLE public.cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ai_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_account_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

-- AI Accounts policies (public can view, admin can manage)
CREATE POLICY "Anyone can view available AI accounts"
ON public.ai_accounts FOR SELECT
USING (is_available = true);

CREATE POLICY "Allow all AI accounts management"
ON public.ai_accounts FOR ALL
USING (true) WITH CHECK (true);

-- AI Account Purchases policies
CREATE POLICY "Users can view their own AI account purchases"
ON public.ai_account_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI account purchases"
ON public.ai_account_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all AI account purchases management"
ON public.ai_account_purchases FOR ALL
USING (true) WITH CHECK (true);

-- Refund Requests policies
CREATE POLICY "Users can view their own refund requests"
ON public.refund_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refund requests"
ON public.refund_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all refund requests management"
ON public.refund_requests FOR ALL
USING (true) WITH CHECK (true);

-- Cancellation Requests policies
CREATE POLICY "Users can view their own cancellation requests"
ON public.cancellation_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cancellation requests"
ON public.cancellation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all cancellation requests management"
ON public.cancellation_requests FOR ALL
USING (true) WITH CHECK (true);

-- Enable realtime for admin live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_account_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cancellation_requests;

-- Triggers for updated_at
CREATE TRIGGER update_ai_accounts_updated_at
BEFORE UPDATE ON public.ai_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();