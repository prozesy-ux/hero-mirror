-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own messages (only as 'user' sender)
CREATE POLICY "Users can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND sender_type = 'user');

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON public.support_messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert replies (as 'admin' sender to any user)
CREATE POLICY "Admins can reply" ON public.support_messages
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') AND sender_type = 'admin');

-- Admins can update read status
CREATE POLICY "Admins can mark as read" ON public.support_messages
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;