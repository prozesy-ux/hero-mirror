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
    const workerUrl = Deno.env.get("CLOUDFLARE_EMAIL_WORKER_URL");
    const emailSecret = Deno.env.get("CLOUDFLARE_EMAIL_SECRET");
    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@uptoza.com";

    if (!workerUrl || !emailSecret) {
      throw new Error("Email configuration missing: CLOUDFLARE_EMAIL_WORKER_URL or CLOUDFLARE_EMAIL_SECRET");
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
      // Log as skipped
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

    // Call Cloudflare Worker
    console.log(`Calling worker: ${workerUrl} with from: ${fromAddress}, secret length: ${emailSecret.length}`);
    
    // Cloudflare Access Service Token headers (for Zero Trust bypass)
    const cfAccessClientId = Deno.env.get("CF_ACCESS_CLIENT_ID");
    const cfAccessClientSecret = Deno.env.get("CF_ACCESS_CLIENT_SECRET");
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Email-Secret": emailSecret,
    };
    
    // Add Cloudflare Access headers if configured (required when Worker is behind Access)
    if (cfAccessClientId && cfAccessClientSecret) {
      headers["CF-Access-Client-Id"] = cfAccessClientId;
      headers["CF-Access-Client-Secret"] = cfAccessClientSecret;
      console.log("Using Cloudflare Access service token for authentication");
    } else {
      console.log("No Cloudflare Access credentials configured");
    }
    
    const response = await fetch(workerUrl, {
      method: "POST",
      headers,
      // Avoid automatically following redirects so we can diagnose the true origin.
      redirect: "manual",
      body: JSON.stringify({
        to,
        toName: '',
        from: fromAddress,
        fromName: 'Uptoza',
        subject,
        html,
      }),
    });

    console.log(
      `Worker response headers: server=${response.headers.get("server")}; cf-ray=${response.headers.get("cf-ray")}; location=${response.headers.get("location")}`
    );

    // Always get raw response text first
    const rawResponseText = await response.text();
    console.log(`Worker response status: ${response.status}, body: ${rawResponseText.substring(0, 500)}`);

    // Try to parse as JSON
    let result: any = {};
    let parseError = false;
    try {
      result = JSON.parse(rawResponseText);
    } catch {
      parseError = true;
      result = { raw: rawResponseText };
    }

    if (!response.ok) {
      const errorMsg = result.error || result.raw || `HTTP ${response.status}`;
      console.error("Cloudflare Worker error:", errorMsg);

      // Update log as failed with full details
      if (logId) {
        await supabaseAdmin
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: `HTTP ${response.status}: ${errorMsg}`,
            metadata: {
              worker_status: response.status,
              raw_response: rawResponseText.substring(0, 1000),
            },
          })
          .eq('id', logId);
      }

      // IMPORTANT: returning 500 here causes the admin UI to treat it as a runtime crash.
      // For expected upstream failures (like 401/403), return a normal JSON response.
      const isAuthError = response.status === 401 || response.status === 403;
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          worker_status: response.status,
          auth_error: isAuthError,
          log_id: logId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if worker actually confirmed sending
    const hasMessageId = result.id || result.messageId || result.message_id;
    const workerConfirmed = hasMessageId || result.success === true || result.accepted === true;
    
    // Update log with appropriate status
    if (logId) {
      await supabaseAdmin.from('email_logs')
        .update({ 
          status: workerConfirmed ? 'sent' : 'sent_unverified',
          resend_id: hasMessageId || null,
          metadata: { 
            worker_status: response.status, 
            worker_confirmed: workerConfirmed,
            parse_error: parseError,
            raw_response: rawResponseText.substring(0, 500)
          }
        })
        .eq('id', logId);
    }

    console.log(`Email ${workerConfirmed ? 'sent' : 'sent (unverified)'} to ${to} - Template: ${template_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: workerConfirmed ? "Email sent successfully" : "Email sent (unverified)", 
        log_id: logId,
        verified: workerConfirmed
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