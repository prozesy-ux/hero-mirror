-- Add new email preference columns to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS order_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wallet_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS product_emails BOOLEAN DEFAULT true;

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all email logs (via edge function with service role)
-- Users can only see their own email logs
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert (via service role in edge functions)
CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Enable realtime for email_logs
ALTER PUBLICATION supabase_realtime ADD TABLE email_logs;