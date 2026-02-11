
-- Add card customization columns to seller_profiles
ALTER TABLE public.seller_profiles 
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS card_button_text text DEFAULT 'Buy',
  ADD COLUMN IF NOT EXISTS card_button_color text DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS card_button_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS card_accent_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS card_border_radius text DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS card_show_rating boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_seller_name boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_badge boolean DEFAULT true;
