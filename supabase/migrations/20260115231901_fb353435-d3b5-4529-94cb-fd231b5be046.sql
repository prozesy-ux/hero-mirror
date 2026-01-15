-- Create security_logs table for tracking suspicious activity
CREATE TABLE public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  user_id UUID,
  event_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  blocked_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast IP lookups
CREATE INDEX idx_security_logs_ip ON public.security_logs(ip_address);
CREATE INDEX idx_security_logs_blocked ON public.security_logs(is_blocked, blocked_until);
CREATE INDEX idx_security_logs_event ON public.security_logs(event_type, created_at);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read security logs
CREATE POLICY "Admins can read security logs"
ON public.security_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update security logs (unblock)
CREATE POLICY "Admins can update security logs"
ON public.security_logs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete security logs
CREATE POLICY "Admins can delete security logs"
ON public.security_logs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create rate_limits table for tracking request counts
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint)
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Enable RLS (edge functions use service role)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limits
CREATE POLICY "Admins can read rate limits"
ON public.rate_limits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to clean old rate limit records
CREATE OR REPLACE FUNCTION public.clean_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;