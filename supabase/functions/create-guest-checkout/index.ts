import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GuestCheckoutRequest {
  productId: string;
  productName: string;
  price: number;
  guestEmail: string;
  productType: 'ai' | 'seller';
  sellerId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, price, guestEmail, productType, sellerId }: GuestCheckoutRequest = await req.json();

    // Validate required fields
    if (!productId || !productName || !price || !guestEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client to look up seller if needed
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get seller_id from product if not provided
    let resolvedSellerId = sellerId || null;
    
    if (!resolvedSellerId && productType === 'seller') {
      const { data: product } = await supabaseClient
        .from('seller_products')
        .select('seller_id')
        .eq('id', productId)
        .single();
      
      if (product) {
        resolvedSellerId = product.seller_id;
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://hero-mirror.lovable.app";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/marketplace?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/marketplace?purchase=cancelled`,
      metadata: {
        productId,
        productName,
        productType,
        guestEmail,
        sellerId: resolvedSellerId || '',
        priceAmount: price.toString(),
      },
    });

    console.log("Guest checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating guest checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
