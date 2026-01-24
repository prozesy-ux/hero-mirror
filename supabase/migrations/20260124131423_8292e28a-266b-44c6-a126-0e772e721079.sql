-- Create email settings table for global toggle control
CREATE TABLE IF NOT EXISTS public.email_settings (
    id text PRIMARY KEY DEFAULT 'global',
    email_enabled boolean NOT NULL DEFAULT true,
    order_emails_enabled boolean NOT NULL DEFAULT true,
    wallet_emails_enabled boolean NOT NULL DEFAULT true,
    marketing_emails_enabled boolean NOT NULL DEFAULT true,
    security_emails_enabled boolean NOT NULL DEFAULT true,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Insert default global settings row
INSERT INTO public.email_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- No public access - admin only via edge functions
CREATE POLICY "No direct access to email_settings"
ON public.email_settings
FOR ALL
USING (false);

-- Add RLS to email_logs if not exists (admin only via edge functions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'No direct access to email_logs'
    ) THEN
        ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "No direct access to email_logs"
        ON public.email_logs
        FOR ALL
        USING (false);
    END IF;
END $$;