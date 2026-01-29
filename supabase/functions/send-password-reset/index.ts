import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Professional password reset email template (matches email-templates.ts)
const getPasswordResetHtml = (resetUrl: string, siteUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uptoza</title>
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto;">
    <!-- Header -->
    <div style="text-align: center; padding: 32px 0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">uptoza</h1>
    </div>
    
    <!-- Content Card -->
    <div style="background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      <div style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
            <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </div>
        </div>
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Reset your password</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
          We received a request to reset the password for your account. Click the button below to create a new password.
        </p>
        <div style="text-align: center; padding: 8px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 14px; text-decoration: none;">Reset Password</a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 32px 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} Uptoza. All rights reserved.
      </p>
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        <a href="${siteUrl}/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Simple hash function for token storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, siteUrl } = await req.json();

    if (!email || typeof email !== 'string') {
      // Always return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@uptoza.com";

    if (!resendApiKey) {
      console.error("[send-password-reset] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true }), // Always return success
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Rate limiting: Check if too many requests for this email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentTokens, error: countError } = await supabase
      .from('password_reset_tokens')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .gte('created_at', oneHourAgo);

    if (recentTokens && recentTokens.length >= 3) {
      console.log(`[send-password-reset] Rate limit exceeded for ${email}`);
      return new Response(
        JSON.stringify({ success: true }), // Always return success
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up user by email using admin API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      console.log(`[send-password-reset] User not found for email: ${email}`);
      // Always return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID() + crypto.randomUUID(); // 64 chars
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        email: email.toLowerCase().trim(),
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error("[send-password-reset] Failed to store token:", insertError);
      throw new Error("Failed to create reset token");
    }

    // Build reset URL
    const baseUrl = siteUrl || "https://hero-mirror.lovable.app";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "Reset your password",
      html: getPasswordResetHtml(resetUrl, baseUrl)
    });

    console.log(`[send-password-reset] Email sent to ${email}:`, emailResponse);

    // Log email for tracking
    await supabase.from('email_logs').insert({
      recipient_email: email,
      template_id: 'password_reset',
      subject: 'Reset your password',
      status: 'sent',
      user_id: user.id,
      resend_id: emailResponse?.data?.id || null
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[send-password-reset] Error:", error);
    // Always return success to prevent information leakage
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
