import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  guestToken: string;
}

// Fetch email from Razorpay payment details
async function fetchEmailFromRazorpay(paymentId: string): Promise<string | null> {
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  
  if (!razorpayKeyId || !razorpayKeySecret) {
    return null;
  }

  try {
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch payment details from Razorpay");
      return null;
    }

    const paymentData = await response.json();
    return paymentData.email || null;
  } catch (error) {
    console.error("Error fetching email from Razorpay:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, guestToken }: VerifyRequest = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !guestToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const key = encoder.encode(razorpayKeySecret);
    const data = encoder.encode(body);
    
    const hmac = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", hmac, data);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch");
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode guest token
    let tokenData: any;
    try {
      tokenData = JSON.parse(atob(guestToken));
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid session token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let { email, productId, productType, sellerId, price, productName } = tokenData;

    // If email is not in token, fetch from Razorpay API
    if (!email) {
      console.log("Email not in token, fetching from Razorpay API...");
      email = await fetchEmailFromRazorpay(razorpay_payment_id);
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Could not retrieve email from payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Email fetched from Razorpay:", email);
    }

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Invalid session data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for idempotency - see if order already exists for this Razorpay order
    const { data: existingOrder } = await supabaseAdmin
      .from('seller_orders')
      .select('id')
      .eq('gateway_transaction_id', razorpay_payment_id)
      .maybeSingle();

    if (existingOrder) {
      console.log("Order already processed for payment:", razorpay_payment_id);
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

    const { data: userSearchResult } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (userSearchResult) {
      userId = userSearchResult.user_id;
      console.log("Existing user found:", userId);
    } else {
      // Create new user with temp password
      tempPassword = crypto.randomUUID().slice(0, 12);
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0],
          created_via: 'guest_checkout_razorpay',
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
    const platformFeePercent = 10;
    const platformFee = price * (platformFeePercent / 100);
    const sellerEarning = price - platformFee;

    // Create the order
    const orderData: Record<string, any> = {
      buyer_id: userId,
      product_id: productId,
      amount: price,
      seller_earning: sellerEarning,
      status: 'pending',
      guest_email: email,
      payment_gateway: 'razorpay',
      gateway_transaction_id: razorpay_payment_id,
    };

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
    }

    // Create notification for the buyer
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'order',
      title: 'Order Confirmed!',
      message: `Your purchase of ${productName} is complete.`,
      link: '/dashboard/marketplace?tab=purchases',
    });

    // Generate session for new user
    let authSession = null;
    if (isNewUser && tempPassword) {
      const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: tempPassword,
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
          amount: price,
          orderId: order.id,
          paymentMethod: 'Razorpay',
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
    console.error("Error verifying guest Razorpay payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
