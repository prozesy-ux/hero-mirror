
-- New columns on support_messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS is_voice_note boolean DEFAULT false;

-- New columns on seller_chats
ALTER TABLE public.seller_chats ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.seller_chats ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.seller_chats ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE public.seller_chats ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE public.seller_chats ADD COLUMN IF NOT EXISTS is_voice_note boolean DEFAULT false;

-- New columns on support_tickets
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS is_snoozed boolean DEFAULT false;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS snooze_until timestamptz;

-- Pinned messages table
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  chat_id uuid,
  message_id text NOT NULL,
  pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pinned messages" ON public.pinned_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pinned chats table
CREATE TABLE IF NOT EXISTS public.pinned_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  buyer_id uuid,
  seller_id uuid,
  pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pinned chats" ON public.pinned_chats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat settings table
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  theme text NOT NULL DEFAULT 'default',
  bg_image_url text,
  bg_color text,
  bubble_style text NOT NULL DEFAULT 'rounded',
  font_size text NOT NULL DEFAULT 'medium',
  notification_sound boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat settings" ON public.chat_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Snoozed tickets table
CREATE TABLE IF NOT EXISTS public.snoozed_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  buyer_id uuid,
  snooze_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.snoozed_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snoozed tickets" ON public.snoozed_tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_settings;
