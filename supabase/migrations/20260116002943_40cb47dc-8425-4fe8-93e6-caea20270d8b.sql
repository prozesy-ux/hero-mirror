-- Create payment_methods table for managing payment gateways
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  account_number TEXT,
  account_name TEXT,
  instructions TEXT,
  is_enabled BOOLEAN DEFAULT true,
  is_automatic BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view enabled payment methods (for billing page)
CREATE POLICY "Anyone can view enabled payment methods"
ON public.payment_methods
FOR SELECT
USING (is_enabled = true);

-- Admins can view all payment methods
CREATE POLICY "Admins can view all payment methods"
ON public.payment_methods
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert payment methods
CREATE POLICY "Admins can insert payment methods"
ON public.payment_methods
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update payment methods
CREATE POLICY "Admins can update payment methods"
ON public.payment_methods
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete payment methods
CREATE POLICY "Admins can delete payment methods"
ON public.payment_methods
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, code, is_automatic, display_order, instructions) VALUES
  ('Stripe', 'stripe', true, 1, 'Pay securely with credit or debit card'),
  ('bKash', 'bkash', false, 2, 'Send money to our bKash number and enter the transaction ID'),
  ('Nagad', 'nagad', false, 3, 'Send money to our Nagad number and enter the transaction ID'),
  ('JazzCash', 'jazzcash', false, 4, 'Send money to our JazzCash number and enter the transaction ID'),
  ('UPI', 'upi', false, 5, 'Pay using any UPI app and enter the transaction ID'),
  ('Cash on Delivery', 'cod', false, 6, 'Pay when you receive your order'),
  ('Binance (Crypto)', 'binance', false, 7, 'Send crypto to our Binance ID and enter the transaction ID');