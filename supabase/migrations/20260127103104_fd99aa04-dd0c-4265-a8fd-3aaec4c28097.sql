-- Create withdrawal method configuration table for admin control
CREATE TABLE IF NOT EXISTS public.withdrawal_method_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'digital_wallet', 'crypto')),
  method_code TEXT,
  method_name TEXT,
  is_enabled BOOLEAN DEFAULT true,
  min_withdrawal NUMERIC DEFAULT 5,
  max_withdrawal NUMERIC DEFAULT 1000,
  exchange_rate NUMERIC DEFAULT 1,
  custom_logo_url TEXT,
  brand_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index for country + account_type + method_code combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawal_method_config_unique 
ON public.withdrawal_method_config (country_code, account_type, COALESCE(method_code, ''));

-- Enable RLS
ALTER TABLE public.withdrawal_method_config ENABLE ROW LEVEL SECURITY;

-- Policy: No direct access, only through admin edge functions
CREATE POLICY "No direct access to withdrawal config" 
ON public.withdrawal_method_config
FOR ALL USING (false);

-- Create trigger for updated_at
CREATE TRIGGER update_withdrawal_method_config_updated_at
BEFORE UPDATE ON public.withdrawal_method_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data for popular countries
INSERT INTO public.withdrawal_method_config (country_code, account_type, method_code, method_name, is_enabled, min_withdrawal, max_withdrawal, brand_color)
VALUES 
  -- Bangladesh
  ('BD', 'bank', NULL, 'Bank Transfer', true, 500, 100000, '#1E3A5F'),
  ('BD', 'digital_wallet', 'bkash', 'bKash', true, 50, 25000, '#E2136E'),
  ('BD', 'digital_wallet', 'nagad', 'Nagad', true, 50, 25000, '#FF6A00'),
  ('BD', 'digital_wallet', 'rocket', 'Rocket', true, 50, 25000, '#8B2C92'),
  ('BD', 'digital_wallet', 'upay', 'Upay', true, 50, 25000, '#00A884'),
  
  -- India
  ('IN', 'bank', NULL, 'Bank Transfer', true, 100, 200000, '#1E3A5F'),
  ('IN', 'digital_wallet', 'phonepe', 'PhonePe', true, 100, 100000, '#5F259F'),
  ('IN', 'digital_wallet', 'paytm', 'Paytm', true, 100, 100000, '#00BAF2'),
  ('IN', 'digital_wallet', 'gpay', 'Google Pay', true, 100, 100000, '#4285F4'),
  ('IN', 'digital_wallet', 'amazonpay', 'Amazon Pay', true, 100, 50000, '#FF9900'),
  
  -- Pakistan
  ('PK', 'bank', NULL, 'Bank Transfer', true, 500, 500000, '#1E3A5F'),
  ('PK', 'digital_wallet', 'easypaisa', 'EasyPaisa', true, 100, 50000, '#00A651'),
  ('PK', 'digital_wallet', 'jazzcash', 'JazzCash', true, 100, 50000, '#ED1C24'),
  ('PK', 'digital_wallet', 'sadapay', 'SadaPay', true, 100, 50000, '#6366F1'),
  
  -- USA
  ('US', 'bank', NULL, 'Bank Transfer (ACH)', true, 10, 50000, '#1E3A5F'),
  ('US', 'digital_wallet', 'venmo', 'Venmo', true, 5, 5000, '#3D95CE'),
  ('US', 'digital_wallet', 'paypal', 'PayPal', true, 5, 10000, '#003087'),
  ('US', 'digital_wallet', 'zelle', 'Zelle', true, 5, 2500, '#6D1ED4'),
  ('US', 'digital_wallet', 'cashapp', 'Cash App', true, 5, 7500, '#00D632'),
  ('US', 'crypto', 'bitcoin', 'Bitcoin', true, 20, 100000, '#F7931A'),
  ('US', 'crypto', 'ethereum', 'Ethereum', true, 20, 100000, '#627EEA'),
  ('US', 'crypto', 'usdt', 'USDT (TRC20)', true, 10, 100000, '#26A17B'),
  
  -- UK
  ('GB', 'bank', NULL, 'Bank Transfer', true, 10, 50000, '#1E3A5F'),
  ('GB', 'digital_wallet', 'paypal', 'PayPal', true, 5, 10000, '#003087'),
  ('GB', 'digital_wallet', 'revolut', 'Revolut', true, 5, 10000, '#0075EB'),
  ('GB', 'digital_wallet', 'wise', 'Wise', true, 5, 10000, '#9FE870'),
  
  -- Philippines
  ('PH', 'bank', NULL, 'Bank Transfer', true, 100, 100000, '#1E3A5F'),
  ('PH', 'digital_wallet', 'gcash', 'GCash', true, 50, 50000, '#007DFE'),
  ('PH', 'digital_wallet', 'maya', 'Maya', true, 50, 50000, '#00D66E'),
  ('PH', 'digital_wallet', 'grabpay', 'GrabPay', true, 50, 50000, '#00B14F'),
  
  -- Indonesia
  ('ID', 'bank', NULL, 'Bank Transfer', true, 50000, 50000000, '#1E3A5F'),
  ('ID', 'digital_wallet', 'dana', 'DANA', true, 10000, 10000000, '#118EEA'),
  ('ID', 'digital_wallet', 'ovo', 'OVO', true, 10000, 10000000, '#4C3494'),
  ('ID', 'digital_wallet', 'gopay', 'GoPay', true, 10000, 10000000, '#00AA13'),
  ('ID', 'digital_wallet', 'shopeepay', 'ShopeePay', true, 10000, 10000000, '#EE4D2D'),
  
  -- Malaysia
  ('MY', 'bank', NULL, 'Bank Transfer', true, 10, 50000, '#1E3A5F'),
  ('MY', 'digital_wallet', 'touchngo', 'Touch n Go', true, 5, 10000, '#005ABB'),
  ('MY', 'digital_wallet', 'grabpay', 'GrabPay', true, 5, 10000, '#00B14F'),
  ('MY', 'digital_wallet', 'boost', 'Boost', true, 5, 10000, '#EF3340'),
  
  -- Nigeria
  ('NG', 'bank', NULL, 'Bank Transfer', true, 1000, 10000000, '#1E3A5F'),
  ('NG', 'digital_wallet', 'opay', 'OPay', true, 500, 1000000, '#1DC06D'),
  ('NG', 'digital_wallet', 'palmpay', 'PalmPay', true, 500, 1000000, '#5D3FD3'),
  ('NG', 'digital_wallet', 'kuda', 'Kuda', true, 500, 1000000, '#40196D'),
  
  -- Global Crypto Options
  ('GLOBAL', 'crypto', 'bitcoin', 'Bitcoin', true, 20, 1000000, '#F7931A'),
  ('GLOBAL', 'crypto', 'ethereum', 'Ethereum', true, 20, 1000000, '#627EEA'),
  ('GLOBAL', 'crypto', 'usdt', 'USDT (TRC20)', true, 10, 1000000, '#26A17B'),
  ('GLOBAL', 'crypto', 'usdc', 'USDC', true, 10, 1000000, '#2775CA')
ON CONFLICT DO NOTHING;