import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  template_id: string;
  to: string;
  subject: string;
  html: string;
  category?: 'security' | 'order' | 'wallet' | 'marketing';
  user_id?: string;
  variables?: Record<string, string>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role for logging
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let logId: string | null = null;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS") || "onboarding@resend.dev";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it in Lovable Cloud secrets.");
    }

    const { template_id, to, subject, html, category, user_id }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    // Check global email settings
    const { data: settings } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    // Check if emails are enabled
    if (settings && !settings.email_enabled) {
      await supabaseAdmin.from('email_logs').insert({
        user_id: user_id || null,
        template_id,
        recipient_email: to,
        subject,
        status: 'skipped',
        error_message: 'Email sending is globally disabled',
        sent_at: new Date().toISOString(),
      });

      console.log(`Email skipped (globally disabled): ${to} - Template: ${template_id}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Email sending is disabled' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check category-specific settings
    if (settings && category) {
      const categoryKey = `${category}_emails_enabled`;
      if (settings[categoryKey] === false) {
        await supabaseAdmin.from('email_logs').insert({
          user_id: user_id || null,
          template_id,
          recipient_email: to,
          subject,
          status: 'skipped',
          error_message: `${category} emails are disabled`,
          sent_at: new Date().toISOString(),
        });

        console.log(`Email skipped (${category} disabled): ${to} - Template: ${template_id}`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: `${category} emails are disabled` }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Create pending log entry
    const { data: logEntry } = await supabaseAdmin.from('email_logs').insert({
      user_id: user_id || null,
      template_id,
      recipient_email: to,
      subject,
      status: 'pending',
      sent_at: new Date().toISOString(),
    }).select('id').single();

    logId = logEntry?.id;

    // Send email via Resend API directly
    console.log(`Sending email via Resend to: ${to}, from: ${fromAddress}`);
    
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);

      // Update log as failed
      if (logId) {
        await supabaseAdmin
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: resendData.message || resendData.error || JSON.stringify(resendData),
          })
          .eq('id', logId);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: resendData.message || resendData.error || "Failed to send email",
          log_id: logId 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully via Resend:", resendData);

    // Update log with success
    if (logId) {
      await supabaseAdmin.from('email_logs')
        .update({ 
          status: 'sent',
          resend_id: resendData.id || null,
          metadata: { 
            provider: 'resend',
            resend_response: resendData 
          }
        })
        .eq('id', logId);
    }

    console.log(`Email sent to ${to} - Template: ${template_id} - Resend ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully", 
        log_id: logId,
        resend_id: resendData.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Send email error:", error);
    
    // If we have a log entry, update it as failed
    if (logId) {
      try {
        await supabaseAdmin.from('email_logs')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', logId);
      } catch (logError) {
        console.error("Failed to update log entry:", logError);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
