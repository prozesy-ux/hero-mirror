-- Create buyer_withdrawals table for buyer withdrawal functionality
CREATE TABLE public.buyer_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  account_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.buyer_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies for buyer_withdrawals
CREATE POLICY "Users can view own withdrawals" 
ON public.buyer_withdrawals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" 
ON public.buyer_withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin can manage all withdrawals
CREATE POLICY "Admin can manage all buyer withdrawals"
ON public.buyer_withdrawals FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_withdrawals;