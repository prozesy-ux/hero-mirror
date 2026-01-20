-- Create secure seller profiles view (excludes user_id for privacy)
CREATE VIEW public.seller_profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  store_name,
  store_slug,
  store_description,
  store_tagline,
  store_logo_url,
  store_banner_url,
  is_verified,
  total_sales,
  total_orders,
  social_links,
  created_at
FROM public.seller_profiles
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.seller_profiles_public TO anon, authenticated;