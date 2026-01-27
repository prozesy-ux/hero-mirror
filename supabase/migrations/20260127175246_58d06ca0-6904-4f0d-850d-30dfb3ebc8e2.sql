-- Create search_history table for tracking user searches
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user-specific queries
CREATE INDEX idx_search_history_user_id ON search_history(user_id, created_at DESC);

-- Index for popular searches aggregation
CREATE INDEX idx_search_history_query ON search_history(query, created_at DESC);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own search history
CREATE POLICY "Users can view own search history"
ON public.search_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own searches
CREATE POLICY "Users can insert own searches"
ON public.search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
ON public.search_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create popular_searches table for trending terms
CREATE TABLE public.popular_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  last_searched_at TIMESTAMPTZ DEFAULT now(),
  is_trending BOOLEAN DEFAULT false
);

-- Index for trending queries
CREATE INDEX idx_popular_searches_trending ON popular_searches(is_trending, search_count DESC);

-- Enable RLS
ALTER TABLE public.popular_searches ENABLE ROW LEVEL SECURITY;

-- Anyone can view popular searches (public data)
CREATE POLICY "Anyone can view popular searches"
ON public.popular_searches
FOR SELECT
USING (true);

-- Only edge functions can modify popular searches (via service role)
CREATE POLICY "No direct modification of popular searches"
ON public.popular_searches
FOR ALL
USING (false);

-- Function to update popular searches (called from edge function)
CREATE OR REPLACE FUNCTION public.upsert_popular_search(p_query TEXT, p_category_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO popular_searches (query, category_id, search_count, last_searched_at)
  VALUES (lower(trim(p_query)), p_category_id, 1, now())
  ON CONFLICT (query) DO UPDATE SET
    search_count = popular_searches.search_count + 1,
    last_searched_at = now(),
    category_id = COALESCE(p_category_id, popular_searches.category_id);
END;
$$;