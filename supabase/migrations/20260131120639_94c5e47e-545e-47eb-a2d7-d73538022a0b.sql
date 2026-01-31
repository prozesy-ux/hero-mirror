-- Create SEO settings table
CREATE TABLE public.seo_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_title TEXT,
  site_description TEXT,
  og_image_url TEXT,
  twitter_handle TEXT,
  google_indexing_enabled BOOLEAN DEFAULT false,
  google_service_account_email TEXT,
  google_service_account_key TEXT,
  indexnow_enabled BOOLEAN DEFAULT false,
  indexnow_key TEXT,
  robots_txt_content TEXT DEFAULT 'User-agent: *
Allow: /

Sitemap: https://hero-mirror.lovable.app/sitemap.xml',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create URL indexing history table
CREATE TABLE public.url_indexing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  search_engine TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'URL_UPDATED',
  status TEXT NOT NULL DEFAULT 'pending',
  response_data JSONB,
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_indexing_history ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.seo_settings (id, site_title, site_description) 
VALUES ('global', 'Uptoza - AI Products Marketplace', 'Premium AI tools, accounts, and digital products marketplace');

-- Create index for faster history queries
CREATE INDEX idx_url_indexing_history_created_at ON public.url_indexing_history(created_at DESC);
CREATE INDEX idx_url_indexing_history_status ON public.url_indexing_history(status);