import { supabase } from '@/integrations/supabase/client';

/**
 * Track when a user views a product (modal or full page)
 * Increments both view_count on seller_products and product_analytics
 */
export const trackProductView = async (productId: string): Promise<void> => {
  try {
    await supabase.rpc('increment_seller_product_view', { p_product_id: productId });
  } catch (error) {
    console.error('[Analytics] Failed to track view:', error);
  }
};

/**
 * Track when a user clicks on a product card (from marketplace sections)
 * Increments clicks in product_analytics
 */
export const trackProductClick = async (productId: string): Promise<void> => {
  try {
    await supabase.rpc('increment_product_click', { p_product_id: productId });
  } catch (error) {
    console.error('[Analytics] Failed to track click:', error);
  }
};
