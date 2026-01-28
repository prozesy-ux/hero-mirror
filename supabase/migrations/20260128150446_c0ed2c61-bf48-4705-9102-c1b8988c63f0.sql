-- Phase 2: Enable typo tolerance with fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for fast fuzzy search
CREATE INDEX IF NOT EXISTS idx_ai_accounts_name_trgm 
  ON ai_accounts USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_seller_products_name_trgm 
  ON seller_products USING gin(name gin_trgm_ops);

-- Synonyms table for search expansion
CREATE TABLE IF NOT EXISTS search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  synonyms text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE search_synonyms ENABLE ROW LEVEL SECURITY;

-- Allow public read access for synonyms
CREATE POLICY "Anyone can read synonyms" ON search_synonyms
  FOR SELECT USING (true);

-- Insert common AI tool synonyms
INSERT INTO search_synonyms (term, synonyms) VALUES
  ('chatgpt', ARRAY['gpt', 'openai', 'gpt-4', 'gpt4', 'chat gpt']),
  ('midjourney', ARRAY['mj', 'mid journey', 'midj']),
  ('claude', ARRAY['anthropic', 'claude ai']),
  ('gemini', ARRAY['google ai', 'bard']),
  ('dall-e', ARRAY['dalle', 'dall e', 'openai image'])
ON CONFLICT (term) DO NOTHING;