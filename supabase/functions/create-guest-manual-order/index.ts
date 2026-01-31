import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ManualOrderRequest {
  productId: string;
  productName: string;
  price: number;
  guestEmail: string;
  productType: 'ai' | 'seller';
  paymentMethod: string;
  transactionId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      productId, 
      productName, 
      price, 
      guestEmail, 
      productType, 
      paymentMethod,
      transactionId 
    }: ManualOrderRequest = await req.json();

    // Validate required fields
    if (!productId || !productName || !price || !guestEmail || !paymentMethod || !transactionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for duplicate transaction ID
    const { data: existingTx } = await supabaseAdmin
      .from('guest_pending_orders')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingTx) {
      return new Response(
        JSON.stringify({ error: "This transaction ID has already been submitted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also check in seller_orders for duplicate
    const { data: existingOrder } = await supabaseAdmin
      .from('seller_orders')
      .select('id')
      .eq('gateway_transaction_id', transactionId)
      .maybeSingle();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ error: "This transaction ID has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up seller_id if it's a seller product
    let sellerId: string | null = null;
    if (productType === 'seller') {
      const { data: productData } = await supabaseAdmin
        .from('seller_products')
        .select('seller_id')
        .eq('id', productId)
        .single();

      sellerId = productData?.seller_id || null;
    }

    // Create pending order record for admin approval
    const { data: pendingOrder, error: insertError } = await supabaseAdmin
      .from('guest_pending_orders')
      .insert({
        email: guestEmail,
        product_id: productId,
        product_type: productType,
        product_name: productName,
        amount: price,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        seller_id: sellerId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error("Error creating pending order:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pending order created:", pendingOrder.id);

    // Send confirmation email
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          to: guestEmail,
          templateId: 'order_pending_approval',
          data: {
            productName,
            amount: price,
            transactionId,
            paymentMethod: paymentMethod.toUpperCase(),
          },
        }),
      });
    } catch (emailError) {
      console.error("Failed to send email (non-blocking):", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: pendingOrder.id,
        message: "Order submitted for approval",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating guest manual order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
