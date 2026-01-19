-- Drop existing CHECK constraints on wallet_transactions
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_payment_gateway_check;
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;

-- Recreate payment_gateway constraint to include 'razorpay'
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_payment_gateway_check 
CHECK (payment_gateway IS NULL OR payment_gateway IN ('stripe', 'razorpay', 'bkash', 'upi', 'manual'));

-- Recreate status constraint to include 'rejected'
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_status_check 
CHECK (status IN ('pending', 'completed', 'rejected', 'failed', 'cancelled'));