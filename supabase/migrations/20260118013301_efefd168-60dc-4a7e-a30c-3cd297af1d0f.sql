-- Create chat_join_requests table for buyer support join requests
CREATE TABLE public.chat_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  admin_id UUID,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Buyers can create join requests" ON public.chat_join_requests
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can view own requests" ON public.chat_join_requests
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view requests about them" ON public.chat_join_requests
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM seller_profiles 
    WHERE seller_profiles.id = chat_join_requests.seller_id 
    AND seller_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all requests" ON public.chat_join_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin_joined tracking to seller_chats for when admin joins conversation
ALTER TABLE public.seller_chats 
ADD COLUMN IF NOT EXISTS admin_joined BOOLEAN DEFAULT false;

-- Update RLS for seller_chats to allow admin messages
CREATE POLICY "Admins can send messages to any chat" ON public.seller_chats
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));