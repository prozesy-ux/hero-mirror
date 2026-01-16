-- Create AI Tools table
CREATE TABLE public.ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

-- Anyone can view active AI tools
CREATE POLICY "Anyone can view active AI tools"
ON public.ai_tools
FOR SELECT
USING (is_active = true);

-- Admins can manage all AI tools
CREATE POLICY "Admins can manage AI tools"
ON public.ai_tools
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default AI tools from current hardcoded list
INSERT INTO public.ai_tools (name, icon, color, description, display_order) VALUES
  ('ChatGPT', 'MessageSquare', 'from-green-500 to-emerald-600', 'OpenAI conversational AI', 1),
  ('Midjourney', 'Image', 'from-purple-500 to-violet-600', 'AI image generation', 2),
  ('DALL-E 3', 'Palette', 'from-cyan-500 to-blue-600', 'OpenAI image creation', 3),
  ('Stable Diffusion', 'Sparkles', 'from-orange-500 to-red-600', 'Open-source image AI', 4),
  ('Sora', 'Video', 'from-pink-500 to-rose-600', 'AI video generation', 5),
  ('Claude', 'Bot', 'from-amber-500 to-yellow-600', 'Anthropic conversational AI', 6),
  ('Suno AI', 'Music', 'from-indigo-500 to-purple-600', 'AI music generation', 7),
  ('GitHub Copilot', 'Code', 'from-gray-500 to-slate-600', 'AI code assistant', 8);