import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendUserOTPRequest {
  action_type: "password_change" | "email_change" | "account_delete";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const userEmail = claimsData.user.email;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { action_type }: SendUserOTPRequest = await req.json();

    if (!action_type) {
      return new Response(
        JSON.stringify({ error: "Action type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this user and action
    await serviceClient
      .from("user_otps")
      .delete()
      .eq("user_id", userId)
      .eq("action_type", action_type)
      .eq("verified", false);

    // Store OTP in database
    const { error: otpError } = await serviceClient
      .from("user_otps")
      .insert({
        user_id: userId,
        action_type: action_type,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (otpError) {
      console.error("Failed to store OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format action name for email
    const actionNames: Record<string, string> = {
      password_change: "Password Change",
      email_change: "Email Address Update",
      account_delete: "Account Deletion"
    };

    // Send OTP email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@uptoza.com";

    if (resendApiKey && userEmail) {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 32px 0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">uptoza</h1>
    </div>
    <div style="background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      <div style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
            <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        </div>
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">${actionNames[action_type]} Verification</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
          Enter this code to confirm your ${actionNames[action_type].toLowerCase()}:
        </p>
        <div style="text-align: center; padding: 24px 0;">
          <div style="display: inline-block; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px 40px;">
            <span style="font-family: 'SF Mono', monospace; font-size: 32px; font-weight: 600; color: #1a1a1a; letter-spacing: 6px;">${otpCode}</span>
          </div>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">This code expires in 10 minutes</p>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          If you didn't request this, please ignore this email and secure your account.
        </p>
      </div>
    </div>
    <div style="text-align: center; padding: 32px 20px;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} Uptoza. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [userEmail],
            subject: `${actionNames[action_type]} Verification Code: ${otpCode}`,
            html: emailHtml
          })
        });

        if (!emailRes.ok) {
          console.error("Email send failed:", await emailRes.text());
        }
      } catch (emailError) {
        console.error("Email error:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email",
        expires_at: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
