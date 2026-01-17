-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-attachments bucket
CREATE POLICY "Users can upload their own chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create chat_attachments table
CREATE TABLE public.chat_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.support_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'file')),
  file_name TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on chat_attachments
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_attachments
CREATE POLICY "Users can view their own attachments"
ON public.chat_attachments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
ON public.chat_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
ON public.chat_attachments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attachments"
ON public.chat_attachments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create screen_share_sessions table
CREATE TABLE public.screen_share_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  peer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Enable RLS on screen_share_sessions
ALTER TABLE public.screen_share_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for screen_share_sessions
CREATE POLICY "Users can manage their own sessions"
ON public.screen_share_sessions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.screen_share_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Enable realtime for screen_share_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_share_sessions;