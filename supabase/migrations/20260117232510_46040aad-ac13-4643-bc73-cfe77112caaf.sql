-- Add currency and exchange rate columns to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 4) DEFAULT 1.0;

-- Update existing payment methods with appropriate defaults based on common names
UPDATE public.payment_methods SET currency_code = 'BDT', exchange_rate = 121 WHERE LOWER(name) LIKE '%bkash%' OR LOWER(name) LIKE '%nagad%' OR LOWER(name) LIKE '%rocket%';
UPDATE public.payment_methods SET currency_code = 'INR', exchange_rate = 91 WHERE LOWER(name) LIKE '%upi%' OR LOWER(name) LIKE '%paytm%' OR LOWER(name) LIKE '%phonepe%' OR LOWER(name) LIKE '%gpay%';
UPDATE public.payment_methods SET currency_code = 'PKR', exchange_rate = 290 WHERE LOWER(name) LIKE '%jazzcash%' OR LOWER(name) LIKE '%easypaisa%';
UPDATE public.payment_methods SET currency_code = 'USD', exchange_rate = 1 WHERE LOWER(name) LIKE '%stripe%' OR LOWER(name) LIKE '%binance%' OR LOWER(name) LIKE '%paypal%';