import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  template_id: string;
  to: string;
  subject: string;
  html: string;
  variables?: Record<string, string>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const workerUrl = Deno.env.get("CLOUDFLARE_EMAIL_WORKER_URL");
    const emailSecret = Deno.env.get("CLOUDFLARE_EMAIL_SECRET");
    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@gpzes.com";

    if (!workerUrl || !emailSecret) {
      throw new Error("Email configuration missing");
    }

    const { template_id, to, subject, html, variables }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    // Call Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Email-Secret": emailSecret,
      },
      body: JSON.stringify({
        to,
        from: fromAddress,
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudflare Worker error:", result);
      throw new Error(result.error || "Failed to send email");
    }

    console.log(`Email sent successfully to ${to} - Template: ${template_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
