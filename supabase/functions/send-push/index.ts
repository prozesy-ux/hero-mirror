import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push implementation using Web Crypto API
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidKeys: { publicKey: string; privateKey: string; subject: string }
) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Create JWT for VAPID
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: vapidKeys.subject,
  };

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const claimsB64 = btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import private key for signing
  const privateKeyBytes = Uint8Array.from(
    atob(vapidKeys.privateKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Encrypt the payload using the subscription keys
  const p256dhBytes = Uint8Array.from(
    atob(subscription.p256dh.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
  const authBytes = Uint8Array.from(
    atob(subscription.auth.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  // Generate local key pair for ECDH
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);

  // Import subscriber's public key
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    p256dhBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Create info strings for HKDF
  const encoder = new TextEncoder();
  const keyInfoAuth = new Uint8Array([
    ...encoder.encode("Content-Encoding: auth\0"),
  ]);
  
  // Import shared secret for HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  // Derive IKM using auth secret
  const authKey = await crypto.subtle.importKey(
    "raw",
    authBytes,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const ikm = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: authBytes,
      info: new Uint8Array([
        ...encoder.encode("WebPush: info\0"),
        ...p256dhBytes,
        ...new Uint8Array(localPublicKeyRaw),
      ]),
    },
    sharedSecretKey,
    256
  );

  // Derive content encryption key
  const ikmKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(ikm),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const cekBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: encoder.encode("Content-Encoding: aes128gcm\0"),
    },
    ikmKey,
    128
  );

  const nonceBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: encoder.encode("Content-Encoding: nonce\0"),
    },
    ikmKey,
    96
  );

  // Import CEK for AES-GCM
  const cek = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(cekBits),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Pad and encrypt payload
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // Delimiter

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(nonceBits) },
    cek,
    paddedPayload
  );

  // Build the encrypted content with header
  const recordSize = 4096;
  const header_bytes = new Uint8Array(21 + new Uint8Array(localPublicKeyRaw).length);
  header_bytes.set(salt, 0);
  new DataView(header_bytes.buffer).setUint32(16, recordSize, false);
  header_bytes[20] = new Uint8Array(localPublicKeyRaw).length;
  header_bytes.set(new Uint8Array(localPublicKeyRaw), 21);

  const body = new Uint8Array(header_bytes.length + new Uint8Array(encrypted).length);
  body.set(header_bytes);
  body.set(new Uint8Array(encrypted), header_bytes.length);

  // Send the push notification
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "Content-Length": body.length.toString(),
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${vapidKeys.publicKey}`,
    },
    body: body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push failed: ${response.status} ${text}`);
  }

  return response.status;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, message, link, type } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get VAPID config
    const { data: config, error: configError } = await supabase
      .from("push_config")
      .select("*")
      .eq("id", "default")
      .single();

    if (configError || !config) {
      console.log("No VAPID config found, push notifications not enabled");
      return new Response(
        JSON.stringify({ sent: 0, message: "Push not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true);

    if (subError || !subscriptions?.length) {
      console.log("No active subscriptions for user:", user_id);
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: title || "Uptoza",
      message: message || "You have a new notification",
      link: link || "/dashboard",
      type: type || "general",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      // Create log entry
      const { data: logEntry } = await supabase
        .from("push_logs")
        .insert({
          user_id,
          subscription_id: sub.id,
          notification_type: type,
          title,
          message,
          link,
          status: "pending",
        })
        .select()
        .single();

      try {
        await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          JSON.stringify({ ...JSON.parse(payload), logId: logEntry?.id }),
          {
            publicKey: config.public_key,
            privateKey: config.private_key,
            subject: config.subject,
          }
        );

        // Update log as sent
        if (logEntry) {
          await supabase
            .from("push_logs")
            .update({ status: "sent" })
            .eq("id", logEntry.id);
        }

        // Update last used
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id);

        sent++;
      } catch (error) {
        console.error("Push error for subscription:", sub.id, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        // Update log with error
        if (logEntry) {
          await supabase
            .from("push_logs")
            .update({ status: "failed", error_message: errorMessage })
            .eq("id", logEntry.id);
        }

        // If subscription is gone (410), deactivate it
        if (errorMessage.includes("410")) {
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", sub.id);
        }

        failed++;
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send push error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
