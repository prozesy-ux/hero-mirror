-- Push Notification System Tables

-- 1. VAPID Configuration (auto-generated keys stored here)
CREATE TABLE public.push_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'mailto:support@uptoza.com',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only accessible via service role (edge functions)
ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access" ON public.push_config FOR ALL USING (false);

-- 2. User Device Subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_push_subs_user_active ON public.push_subscriptions(user_id) WHERE is_active = true;

-- 3. Notification Delivery Logs (For Admin Analytics)
CREATE TABLE public.push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  subscription_id UUID REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, clicked
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  clicked_at TIMESTAMPTZ
);

ALTER TABLE public.push_logs ENABLE ROW LEVEL SECURITY;

-- No direct access - managed by edge functions
CREATE POLICY "No direct access to push_logs" ON public.push_logs FOR ALL USING (false);

CREATE INDEX idx_push_logs_user ON public.push_logs(user_id);
CREATE INDEX idx_push_logs_status ON public.push_logs(status);
CREATE INDEX idx_push_logs_sent_at ON public.push_logs(sent_at DESC);

-- 4. Admin Broadcast Messages
CREATE TABLE public.broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  target_audience TEXT DEFAULT 'all', -- all, pro_users, sellers
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, completed
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- No direct access - managed by admin edge functions
CREATE POLICY "No direct access to broadcasts" ON public.broadcast_notifications FOR ALL USING (false);

CREATE INDEX idx_broadcast_status ON public.broadcast_notifications(status);
CREATE INDEX idx_broadcast_created ON public.broadcast_notifications(created_at DESC);

-- Enable realtime for push_subscriptions (for admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_notifications;