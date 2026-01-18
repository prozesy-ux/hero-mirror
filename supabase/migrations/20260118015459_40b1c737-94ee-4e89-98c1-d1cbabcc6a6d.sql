-- Create seller_notifications table
CREATE TABLE public.seller_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own notifications
CREATE POLICY "Sellers can view own notifications"
  ON public.seller_notifications FOR SELECT
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Sellers can update their own notifications (mark as read)
CREATE POLICY "Sellers can update own notifications"
  ON public.seller_notifications FOR UPDATE
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Create seller_support_messages table
CREATE TABLE public.seller_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'seller',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_support_messages ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own messages
CREATE POLICY "Sellers can view own support messages"
  ON public.seller_support_messages FOR SELECT
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Sellers can insert their own messages
CREATE POLICY "Sellers can insert own support messages"
  ON public.seller_support_messages FOR INSERT
  WITH CHECK (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Sellers can update their own messages
CREATE POLICY "Sellers can update own support messages"
  ON public.seller_support_messages FOR UPDATE
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Create seller_chat_attachments table
CREATE TABLE public.seller_chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES seller_support_messages(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_chat_attachments ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own attachments
CREATE POLICY "Sellers can view own attachments"
  ON public.seller_chat_attachments FOR SELECT
  USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Sellers can insert their own attachments
CREATE POLICY "Sellers can insert own attachments"
  ON public.seller_chat_attachments FOR INSERT
  WITH CHECK (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_chat_attachments;