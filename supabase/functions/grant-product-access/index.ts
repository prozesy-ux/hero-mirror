/**
 * Grant Product Access Edge Function
 * 
 * Called after a successful purchase to grant appropriate access based on product type.
 * Handles: instant downloads, courses, memberships, bundles, services, commissions, calls, tips
 * NEW: Auto-delivery for accounts, license keys, and unique downloads
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GrantAccessRequest {
  order_id: string;
  buyer_id: string;
  product_id: string;
  seller_id: string;
}

interface Product {
  id: string;
  product_type: string;
  delivery_type: string;
  membership_period: string | null;
  bundle_product_ids: string[] | null;
  call_duration_minutes: number | null;
  thank_you_message: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { order_id, buyer_id, product_id, seller_id }: GrantAccessRequest = await req.json();

    if (!order_id || !buyer_id || !product_id || !seller_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('seller_products')
      .select('id, product_type, delivery_type, membership_period, bundle_product_ids, call_duration_minutes, thank_you_message')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      console.error('Product fetch error:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await grantAccessByProductType(supabase, {
      order_id,
      buyer_id,
      product_id,
      seller_id,
      product: product as Product
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Grant access error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function grantAccessByProductType(
  supabase: any,
  params: {
    order_id: string;
    buyer_id: string;
    product_id: string;
    seller_id: string;
    product: Product;
  }
) {
  const { order_id, buyer_id, product_id, seller_id, product } = params;
  const productType = product.product_type;
  const deliveryType = product.delivery_type;

  console.log(`Granting access for product type: ${productType}, delivery: ${deliveryType}`);

  // Check for auto-delivery modes first (takes priority over product_type)
  if (['auto_account', 'auto_license', 'auto_download'].includes(deliveryType)) {
    return await handleAutoDelivery(supabase, { order_id, buyer_id, product_id, seller_id });
  }

  switch (productType) {
    // Instant download products
    case 'digital_product':
    case 'ebook':
    case 'template':
    case 'graphics':
    case 'audio':
    case 'video':
    case 'software':
      await createContentAccess(supabase, { buyer_id, order_id, product_id, access_type: 'download' });
      await updateOrderStatus(supabase, order_id, 'completed');
      return { success: true, access_type: 'download', auto_completed: true };

    case 'course':
      await createContentAccess(supabase, { buyer_id, order_id, product_id, access_type: 'course' });
      await updateOrderStatus(supabase, order_id, 'completed');
      return { success: true, access_type: 'course', auto_completed: true };

    case 'membership':
      const expiresAt = calculateMembershipExpiry(product.membership_period);
      await createContentAccess(supabase, { buyer_id, order_id, product_id, access_type: 'membership', access_expires_at: expiresAt });
      await updateOrderStatus(supabase, order_id, 'completed');
      return { success: true, access_type: 'membership', expires_at: expiresAt, auto_completed: true };

    case 'bundle':
      if (product.bundle_product_ids && product.bundle_product_ids.length > 0) {
        for (const bundledProductId of product.bundle_product_ids) {
          const { data: bundledProduct } = await supabase
            .from('seller_products')
            .select('id, product_type, delivery_type, membership_period, bundle_product_ids, call_duration_minutes, thank_you_message')
            .eq('id', bundledProductId)
            .single();
          if (bundledProduct) {
            await grantAccessByProductType(supabase, { order_id, buyer_id, product_id: bundledProductId, seller_id, product: bundledProduct });
          }
        }
      }
      await updateOrderStatus(supabase, order_id, 'completed');
      return { success: true, access_type: 'bundle', auto_completed: true };

    case 'call':
      await createServiceBooking(supabase, { order_id, buyer_id, seller_id, product_id, booking_type: 'call', duration_minutes: product.call_duration_minutes || 30 });
      return { success: true, access_type: 'call', requires_scheduling: true };

    case 'commission':
      await createServiceBooking(supabase, { order_id, buyer_id, seller_id, product_id, booking_type: 'commission', deposit_paid: true });
      return { success: true, access_type: 'commission', deposit_paid: true };

    case 'service':
      await createServiceBooking(supabase, { order_id, buyer_id, seller_id, product_id, booking_type: 'service' });
      return { success: true, access_type: 'service', requires_delivery: true };

    case 'coffee':
      await updateOrderStatus(supabase, order_id, 'completed');
      await createThankYouNotification(supabase, buyer_id, product.thank_you_message);
      return { success: true, access_type: 'tip', auto_completed: true };

    default:
      return { success: true, access_type: 'manual', requires_delivery: true };
  }
}

// =============================================
// Auto-Delivery Handler (Accounts/Keys/Downloads)
// =============================================
async function handleAutoDelivery(
  supabase: any,
  params: { order_id: string; buyer_id: string; product_id: string; seller_id: string }
) {
  const { order_id, buyer_id, product_id, seller_id } = params;

  // Use the atomic RPC function to claim next available item
  const { data: result, error } = await supabase.rpc('assign_delivery_pool_item', {
    p_product_id: product_id,
    p_buyer_id: buyer_id,
    p_order_id: order_id,
  });

  if (error) {
    console.error('Auto-delivery assignment error:', error);
    return { success: false, error: 'Failed to assign delivery item', details: error.message };
  }

  if (!result?.success) {
    console.error('Auto-delivery: no items available');
    // Don't mark order complete - needs manual intervention
    return { success: false, error: result?.error || 'No items available in pool' };
  }

  // Also create content access record for library view
  await createContentAccess(supabase, {
    buyer_id,
    order_id,
    product_id,
    access_type: result.item_type === 'account' ? 'account' : result.item_type === 'license_key' ? 'license' : 'download',
  });

  // Mark order completed
  await updateOrderStatus(supabase, order_id, 'completed');

  // Notify buyer
  await supabase.from('notifications').insert({
    user_id: buyer_id,
    type: 'delivery_complete',
    title: 'Your purchase is ready!',
    message: result.item_type === 'account' 
      ? 'Your account credentials are ready in your library.'
      : result.item_type === 'license_key'
        ? 'Your license key is ready in your library.'
        : 'Your download is ready in your library.',
    link: '/dashboard/library'
  });

  // Notify seller if low stock (5 or fewer remaining)
  if (result.remaining <= 5 && result.remaining > 0) {
    await supabase.from('notifications').insert({
      user_id: seller_id,
      type: 'low_stock_warning',
      title: 'Low Stock Warning',
      message: `Only ${result.remaining} items remaining in delivery pool.`,
      link: '/seller/delivery-inventory'
    });
  }

  // Notify seller if pool is now empty
  if (result.remaining === 0) {
    await supabase.from('notifications').insert({
      user_id: seller_id,
      type: 'out_of_stock',
      title: 'Product Out of Stock',
      message: 'Delivery pool is empty. Product has been hidden. Add more items to resume sales.',
      link: '/seller/delivery-inventory'
    });
  }

  return { 
    success: true, 
    access_type: 'auto_delivery', 
    item_type: result.item_type,
    remaining: result.remaining,
    auto_completed: true 
  };
}

// =============================================
// Helper Functions
// =============================================

async function createContentAccess(
  supabase: any,
  params: { buyer_id: string; order_id: string; product_id: string; access_type: string; access_expires_at?: string | null }
) {
  const { error } = await supabase
    .from('buyer_content_access')
    .upsert({
      buyer_id: params.buyer_id,
      order_id: params.order_id,
      product_id: params.product_id,
      access_type: params.access_type,
      access_expires_at: params.access_expires_at || null,
      access_granted_at: new Date().toISOString()
    }, { onConflict: 'buyer_id,product_id,order_id' });
  if (error) { console.error('Error creating content access:', error); throw error; }
}

async function createServiceBooking(
  supabase: any,
  params: { order_id: string; buyer_id: string; seller_id: string; product_id: string; booking_type: string; duration_minutes?: number; deposit_paid?: boolean }
) {
  const { error } = await supabase.from('service_bookings').insert({
    order_id: params.order_id, buyer_id: params.buyer_id, seller_id: params.seller_id,
    product_id: params.product_id, booking_type: params.booking_type,
    duration_minutes: params.duration_minutes || null, deposit_paid: params.deposit_paid || false, status: 'pending'
  });
  if (error) { console.error('Error creating service booking:', error); throw error; }
}

async function updateOrderStatus(supabase: any, orderId: string, status: string) {
  const { error } = await supabase.from('seller_orders').update({ status }).eq('id', orderId);
  if (error) { console.error('Error updating order status:', error); throw error; }
}

async function createThankYouNotification(supabase: any, buyerId: string, thankYouMessage: string | null) {
  const message = thankYouMessage || 'Thank you for your support! ☕';
  await supabase.from('notifications').insert({
    user_id: buyerId, type: 'tip_received', title: 'Thank You!', message, link: '/dashboard/library'
  });
}

function calculateMembershipExpiry(period: string | null): string | null {
  if (!period) return null;
  const now = new Date();
  switch (period) {
    case 'monthly': now.setMonth(now.getMonth() + 1); break;
    case 'yearly': now.setFullYear(now.getFullYear() + 1); break;
    case 'lifetime': return null;
    default: now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}
