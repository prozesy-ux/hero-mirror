import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_SESSION_KEY = "admin_session_token";

async function validateAdminSession(supabase: any, token: string) {
  const { data, error } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  return !error && data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, token } = body;

    // Validate admin session for all actions
    if (!token || !(await validateAdminSession(supabase, token))) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "get-stats": {
        // Get subscription stats
        const { count: totalSubscriptions } = await supabase
          .from("push_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        const { count: totalUsers } = await supabase
          .from("push_subscriptions")
          .select("user_id", { count: "exact", head: true })
          .eq("is_active", true);

        // Get logs stats for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: sentToday } = await supabase
          .from("push_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "sent")
          .gte("sent_at", today.toISOString());

        const { count: clickedToday } = await supabase
          .from("push_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "clicked")
          .gte("clicked_at", today.toISOString());

        // Get total sent/clicked
        const { count: totalSent } = await supabase
          .from("push_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "sent");

        const { count: totalClicked } = await supabase
          .from("push_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "clicked");

        return new Response(
          JSON.stringify({
            totalSubscriptions: totalSubscriptions || 0,
            totalUsers: totalUsers || 0,
            sentToday: sentToday || 0,
            clickedToday: clickedToday || 0,
            totalSent: totalSent || 0,
            totalClicked: totalClicked || 0,
            ctr: totalSent ? ((totalClicked || 0) / totalSent * 100).toFixed(1) : "0",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-subscriptions": {
        const { limit = 50, offset = 0 } = body;

        const { data: subscriptions, count } = await supabase
          .from("push_subscriptions")
          .select(`
            id,
            user_id,
            device_name,
            user_agent,
            is_active,
            last_used_at,
            created_at
          `, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        return new Response(
          JSON.stringify({ subscriptions, total: count }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-broadcasts": {
        const { limit = 20, offset = 0 } = body;

        const { data: broadcasts, count } = await supabase
          .from("broadcast_notifications")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        return new Response(
          JSON.stringify({ broadcasts, total: count }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-logs": {
        const { limit = 50, offset = 0, status } = body;

        let query = supabase
          .from("push_logs")
          .select("*", { count: "exact" })
          .order("sent_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        const { data: logs, count } = await query;

        return new Response(
          JSON.stringify({ logs, total: count }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create-broadcast": {
        const { title, message, link, target_audience, scheduled_at } = body;

        if (!title || !message) {
          return new Response(
            JSON.stringify({ error: "Title and message required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: broadcast, error } = await supabase
          .from("broadcast_notifications")
          .insert({
            title,
            message,
            link,
            target_audience: target_audience || "all",
            scheduled_at,
            status: scheduled_at ? "scheduled" : "draft",
            created_by: "admin",
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ broadcast }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send-broadcast": {
        const { broadcast_id, title, message, link, target_audience } = body;

        // Get or create broadcast
        let broadcastId = broadcast_id;
        
        if (!broadcastId) {
          const { data: newBroadcast, error } = await supabase
            .from("broadcast_notifications")
            .insert({
              title,
              message,
              link,
              target_audience: target_audience || "all",
              status: "sending",
              created_by: "admin",
            })
            .select()
            .single();

          if (error) throw error;
          broadcastId = newBroadcast.id;
        } else {
          await supabase
            .from("broadcast_notifications")
            .update({ status: "sending" })
            .eq("id", broadcastId);
        }

        // Get broadcast details
        const { data: broadcast } = await supabase
          .from("broadcast_notifications")
          .select("*")
          .eq("id", broadcastId)
          .single();

        if (!broadcast) {
          return new Response(
            JSON.stringify({ error: "Broadcast not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get target users based on audience
        let userQuery = supabase
          .from("push_subscriptions")
          .select("user_id")
          .eq("is_active", true);

        if (broadcast.target_audience === "pro_users") {
          const { data: proUsers } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("is_pro", true);
          
          const proUserIds = proUsers?.map((u: any) => u.user_id) || [];
          userQuery = userQuery.in("user_id", proUserIds);
        } else if (broadcast.target_audience === "sellers") {
          const { data: sellers } = await supabase
            .from("seller_profiles")
            .select("user_id")
            .eq("is_active", true);
          
          const sellerIds = sellers?.map((s: any) => s.user_id) || [];
          userQuery = userQuery.in("user_id", sellerIds);
        }

        const { data: subscriptions } = await userQuery;
        const uniqueUserIds = [...new Set(subscriptions?.map((s: any) => s.user_id) || [])];

        let totalSent = 0;
        let totalFailed = 0;

        // Send to each user via send-push function
        for (const userId of uniqueUserIds) {
          try {
            const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                user_id: userId,
                title: broadcast.title,
                message: broadcast.message,
                link: broadcast.link,
                type: "broadcast",
              }),
            });

            const result = await response.json();
            totalSent += result.sent || 0;
            totalFailed += result.failed || 0;
          } catch (error) {
            console.error("Error sending to user:", userId, error);
            totalFailed++;
          }
        }

        // Update broadcast stats
        await supabase
          .from("broadcast_notifications")
          .update({
            status: "completed",
            sent_at: new Date().toISOString(),
            total_sent: totalSent,
            total_failed: totalFailed,
          })
          .eq("id", broadcastId);

        return new Response(
          JSON.stringify({
            success: true,
            broadcast_id: broadcastId,
            total_users: uniqueUserIds.length,
            total_sent: totalSent,
            total_failed: totalFailed,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-broadcast": {
        const { broadcast_id } = body;

        await supabase
          .from("broadcast_notifications")
          .delete()
          .eq("id", broadcast_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deactivate-subscription": {
        const { subscription_id } = body;

        await supabase
          .from("push_subscriptions")
          .update({ is_active: false })
          .eq("id", subscription_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Broadcast push error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
