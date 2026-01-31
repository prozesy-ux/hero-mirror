import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GuestRazorpayRequest {
  productId: string;
  productName: string;
  price: number;
  guestEmail?: string; // Optional - Razorpay popup will collect it
  productType: 'ai' | 'seller';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, price, guestEmail, productType }: GuestRazorpayRequest = await req.json();

    // Validate required fields (email is now optional - Razorpay collects it)
    if (!productId || !productName || !price) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Look up seller_id if it's a seller product
    let sellerId: string | null = null;
    if (productType === 'seller') {
      const { data: productData } = await supabase
        .from('seller_products')
        .select('seller_id')
        .eq('id', productId)
        .single();

      sellerId = productData?.seller_id || null;
    }

    // Get exchange rate from payment_methods
    const { data: razorpayMethod } = await supabase
      .from('payment_methods')
      .select('exchange_rate')
      .eq('code', 'razorpay')
      .single();

    const exchangeRate = razorpayMethod?.exchange_rate || 83; // Default INR rate
    const amountInPaise = Math.round(price * exchangeRate * 100); // Convert to paise

    // Create Razorpay order
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `guest_${productId.slice(0, 8)}_${Date.now()}`,
        notes: {
          productId,
          productName,
          productType,
          sellerId: sellerId || '',
          guestEmail,
          priceUSD: price.toString(),
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay order creation failed:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData = await orderResponse.json();

    // Create encrypted token with session data for verification
    // Email may be empty - will be fetched from Razorpay API after payment
    const guestToken = btoa(JSON.stringify({
      email: guestEmail || '', // May be empty
      productId,
      productType,
      sellerId,
      price,
      productName,
      razorpayOrderId: orderData.id,
      timestamp: Date.now(),
    }));

    return new Response(
      JSON.stringify({
        order_id: orderData.id,
        key_id: razorpayKeyId,
        amount: amountInPaise,
        currency: "INR",
        guestToken,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating guest Razorpay order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
