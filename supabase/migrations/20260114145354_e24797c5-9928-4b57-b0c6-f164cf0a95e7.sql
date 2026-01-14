-- Create wallet/fund system table
CREATE TABLE public.user_wallets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'refund')),
    amount DECIMAL(10, 2) NOT NULL,
    payment_gateway TEXT CHECK (payment_gateway IN ('stripe', 'bkash', 'upi')),
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- User can view their own wallet
CREATE POLICY "Users can view own wallet"
ON public.user_wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own wallet (auto-created on first topup)
CREATE POLICY "Users can create own wallet"
ON public.user_wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- System/admin can update wallet balance
CREATE POLICY "Admins can update wallets"
ON public.user_wallets
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert transactions
CREATE POLICY "Users can create transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can update transaction status
CREATE POLICY "Admins can update transactions"
ON public.wallet_transactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.user_wallets
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;