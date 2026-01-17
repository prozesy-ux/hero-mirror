-- Add 'seller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Create seller_profiles table
CREATE TABLE public.seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    store_name TEXT NOT NULL,
    store_description TEXT,
    store_logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_sales NUMERIC DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create seller_wallets table
CREATE TABLE public.seller_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC NOT NULL DEFAULT 0.00,
    pending_balance NUMERIC NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create seller_products table
CREATE TABLE public.seller_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0.00,
    icon_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    sold_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create seller_orders table
CREATE TABLE public.seller_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id),
    buyer_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.seller_products(id),
    amount NUMERIC NOT NULL,
    seller_earning NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    credentials TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create seller_chats table (separate from admin support)
CREATE TABLE public.seller_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id),
    buyer_id UUID NOT NULL,
    product_id UUID REFERENCES public.seller_products(id),
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL DEFAULT 'buyer',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create seller_withdrawals table
CREATE TABLE public.seller_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    account_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_profiles
CREATE POLICY "Sellers can view own profile" ON public.seller_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile" ON public.seller_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create seller profile" ON public.seller_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all seller profiles" ON public.seller_profiles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view verified sellers" ON public.seller_profiles
    FOR SELECT USING (is_verified = true AND is_active = true);

-- RLS Policies for seller_wallets
CREATE POLICY "Sellers can view own wallet" ON public.seller_wallets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all wallets" ON public.seller_wallets
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for seller_products
CREATE POLICY "Sellers can manage own products" ON public.seller_products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all products" ON public.seller_products
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view approved products" ON public.seller_products
    FOR SELECT USING (is_available = true AND is_approved = true);

-- RLS Policies for seller_orders
CREATE POLICY "Sellers can view own orders" ON public.seller_orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Sellers can update own orders" ON public.seller_orders
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Buyers can view own orders" ON public.seller_orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create orders" ON public.seller_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admins can manage all orders" ON public.seller_orders
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for seller_chats
CREATE POLICY "Sellers can view own chats" ON public.seller_chats
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Sellers can send messages" ON public.seller_chats
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
        AND sender_type = 'seller'
    );

CREATE POLICY "Sellers can update read status" ON public.seller_chats
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Buyers can view own chats" ON public.seller_chats
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can send messages" ON public.seller_chats
    FOR INSERT WITH CHECK (auth.uid() = buyer_id AND sender_type = 'buyer');

CREATE POLICY "Admins can view all chats" ON public.seller_chats
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for seller_withdrawals
CREATE POLICY "Sellers can view own withdrawals" ON public.seller_withdrawals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Sellers can create withdrawals" ON public.seller_withdrawals
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all withdrawals" ON public.seller_withdrawals
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_orders;

-- Create function to check if user is seller
CREATE OR REPLACE FUNCTION public.is_seller(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.seller_profiles
        WHERE user_id = _user_id
          AND is_verified = true
          AND is_active = true
    )
$$;

-- Create trigger to auto-create wallet when seller is created
CREATE OR REPLACE FUNCTION public.create_seller_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.seller_wallets (seller_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_seller_created
    AFTER INSERT ON public.seller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_seller_wallet();

-- Update timestamps trigger for seller tables
CREATE TRIGGER update_seller_profiles_updated_at
    BEFORE UPDATE ON public.seller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_wallets_updated_at
    BEFORE UPDATE ON public.seller_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_products_updated_at
    BEFORE UPDATE ON public.seller_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();