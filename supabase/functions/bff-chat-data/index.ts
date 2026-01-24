import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  verifyAuth, 
  createServiceClient, 
  corsHeaders, 
  errorResponse, 
  successResponse 
} from "../_shared/auth-verify.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req.headers.get("Authorization"));
    if (!authResult.success || !authResult.userId) {
      return errorResponse(authResult.error || "Unauthorized", 401);
    }

    const userId = authResult.userId;
    const supabase = createServiceClient();

    // Fetch all chat data in parallel
    const [
      supportMessagesResult,
      sellerChatsResult,
      supportAttachmentsResult
    ] = await Promise.all([
      // Support messages (user <-> admin)
      supabase
        .from("support_messages")
        .select(`
          id,
          message,
          sender_type,
          is_read,
          created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),

      // Seller chats (grouped by seller)
      supabase
        .from("seller_chats")
        .select(`
          id,
          message,
          sender_type,
          is_read,
          created_at,
          seller_id,
          product_id,
          admin_joined,
          seller_profiles (
            id,
            store_name,
            store_logo_url
          ),
          seller_products (
            id,
            name,
            images
          )
        `)
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false }),

      // Support chat attachments
      supabase
        .from("chat_attachments")
        .select("id, message_id, file_url, file_name, file_type, file_size")
        .eq("user_id", userId)
    ]);

    // Group seller chats by seller_id to create conversations
    const sellerChats = sellerChatsResult.data || [];
    const conversationsMap = new Map<string, any>();
    
    for (const chat of sellerChats) {
      const sellerId = chat.seller_id;
      if (!conversationsMap.has(sellerId)) {
        conversationsMap.set(sellerId, {
          sellerId,
          sellerProfile: chat.seller_profiles,
          lastMessage: chat.message,
          lastMessageAt: chat.created_at,
          unreadCount: 0,
          messages: []
        });
      }
      
      const conv = conversationsMap.get(sellerId);
      conv.messages.push(chat);
      
      if (!chat.is_read && chat.sender_type === 'seller') {
        conv.unreadCount++;
      }
    }

    const sellerConversations = Array.from(conversationsMap.values());

    // Calculate unread counts
    const supportMessages = supportMessagesResult.data || [];
    const unreadSupportCount = supportMessages.filter(
      m => !m.is_read && m.sender_type === 'admin'
    ).length;

    const totalUnreadSeller = sellerConversations.reduce(
      (sum, conv) => sum + conv.unreadCount, 0
    );

    // Create attachments lookup
    const attachmentsMap = new Map<string, any[]>();
    for (const att of supportAttachmentsResult.data || []) {
      if (!attachmentsMap.has(att.message_id)) {
        attachmentsMap.set(att.message_id, []);
      }
      attachmentsMap.get(att.message_id)!.push(att);
    }

    // Add attachments to support messages
    const supportMessagesWithAttachments = supportMessages.map(msg => ({
      ...msg,
      attachments: attachmentsMap.get(msg.id) || []
    }));

    return successResponse({
      support: {
        messages: supportMessagesWithAttachments,
        unreadCount: unreadSupportCount
      },
      sellerChats: {
        conversations: sellerConversations,
        unreadCount: totalUnreadSeller
      },
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId,
        totalSupportMessages: supportMessages.length,
        totalSellerConversations: sellerConversations.length
      }
    });

  } catch (error) {
    console.error("[bff-chat-data] Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
