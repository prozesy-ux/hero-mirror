import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract metadata
    const metadata = session.metadata || {};
    const email = session.customer_email || metadata.guestEmail;
    const productId = metadata.productId;
    const productType = metadata.productType;
    const sellerId = metadata.sellerId;
    const priceAmount = parseFloat(metadata.priceAmount || "0");
    const productName = metadata.productName;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email found in session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for idempotency - see if order already exists for this session
    const { data: existingOrder } = await supabaseAdmin
      .from('seller_orders')
      .select('id')
      .eq('stripe_session_id', session_id)
      .maybeSingle();

    if (existingOrder) {
      console.log("Order already processed for session:", session_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          orderId: existingOrder.id,
          alreadyProcessed: true 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists with this email
    let userId: string;
    let isNewUser = false;
    let tempPassword: string | null = null;

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // Search for user by email
    const { data: userSearchResult } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (userSearchResult) {
      // User exists
      userId = userSearchResult.user_id;
      console.log("Existing user found:", userId);
    } else {
      // Create new user with temp password
      tempPassword = crypto.randomUUID().slice(0, 12);
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm since they paid
        user_metadata: {
          full_name: email.split('@')[0],
          created_via: 'guest_checkout',
        },
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log("New user created:", userId);
    }

    // Calculate platform fee and seller earning
    const platformFeePercent = 10; // 10% platform fee
    const platformFee = priceAmount * (platformFeePercent / 100);
    const sellerEarning = priceAmount - platformFee;

    // Create the order
    const orderData: Record<string, any> = {
      buyer_id: userId,
      product_id: productId,
      amount: priceAmount,
      seller_earning: sellerEarning,
      status: 'pending',
      guest_email: email,
      stripe_session_id: session_id,
    };

    // Only add seller_id if it's a seller product
    if (productType === 'seller' && sellerId) {
      orderData.seller_id = sellerId;
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('seller_orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created:", order.id);

    // Add to seller's pending balance if seller product
    if (productType === 'seller' && sellerId) {
      await supabaseAdmin.rpc('add_seller_pending_balance', {
        p_seller_id: sellerId,
        p_amount: sellerEarning,
      });
      console.log("Added to seller pending balance:", sellerEarning);
    }

    // Create notification for the buyer
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'order',
      title: 'Order Confirmed!',
      message: `Your purchase of ${productName} is complete.`,
      link: '/dashboard/marketplace?tab=purchases',
    });

    // Generate session for new user so they can be auto-signed in
    let authSession = null;
    if (isNewUser) {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

      // For new users, we'll return the temp password and let frontend sign them in
      // Or generate a session token
      const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: tempPassword!,
      });

      if (sessionData?.session) {
        authSession = {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        };
      }
    }

    // Send welcome/confirmation email
    try {
      const emailPayload: Record<string, any> = {
        to: email,
        templateId: isNewUser ? 'guest_checkout_welcome' : 'order_confirmation',
        data: {
          productName,
          amount: priceAmount,
          orderId: order.id,
        },
      };

      if (isNewUser && tempPassword) {
        emailPayload.data.tempPassword = tempPassword;
      }

      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify(emailPayload),
      });
    } catch (emailError) {
      console.error("Failed to send email (non-blocking):", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        userId,
        isNewUser,
        session: authSession,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error verifying guest payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
