export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          session_token: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_token: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_account_purchases: {
        Row: {
          account_credentials: string | null
          ai_account_id: string
          amount: number
          delivered_at: string | null
          delivery_status: string | null
          id: string
          payment_status: string | null
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          account_credentials?: string | null
          ai_account_id: string
          amount: number
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          payment_status?: string | null
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          account_credentials?: string | null
          ai_account_id?: string
          amount?: number
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          payment_status?: string | null
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_account_purchases_ai_account_id_fkey"
            columns: ["ai_account_id"]
            isOneToOne: false
            referencedRelation: "ai_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_accounts: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_available: boolean | null
          is_featured: boolean | null
          is_trending: boolean | null
          name: string
          original_price: number | null
          price: number
          sold_count: number | null
          stock: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          is_trending?: boolean | null
          name: string
          original_price?: number | null
          price?: number
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          is_trending?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_accounts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tools: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      cancellation_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          reason: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_type: string | null
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          category_type?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          category_type?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          code: string
          created_at: string | null
          currency_code: string | null
          display_order: number | null
          exchange_rate: number | null
          icon_url: string | null
          id: string
          instructions: string | null
          is_automatic: boolean | null
          is_enabled: boolean | null
          name: string
          qr_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          code: string
          created_at?: string | null
          currency_code?: string | null
          display_order?: number | null
          exchange_rate?: number | null
          icon_url?: string | null
          id?: string
          instructions?: string | null
          is_automatic?: boolean | null
          is_enabled?: boolean | null
          name: string
          qr_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          code?: string
          created_at?: string | null
          currency_code?: string | null
          display_order?: number | null
          exchange_rate?: number | null
          icon_url?: string | null
          id?: string
          instructions?: string | null
          is_automatic?: boolean | null
          is_enabled?: boolean | null
          name?: string
          qr_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_pro: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_pro?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_pro?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_free: boolean | null
          is_trending: boolean | null
          title: string
          tool: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_trending?: boolean | null
          title: string
          tool?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_trending?: boolean | null
          title?: string
          tool?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount: number
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          processed_at: string | null
          purchase_id: string | null
          purchase_type: string
          reason: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          processed_at?: string | null
          purchase_id?: string | null
          purchase_type?: string
          reason?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          processed_at?: string | null
          purchase_id?: string | null
          purchase_type?: string
          reason?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      screen_share_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          peer_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          peer_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          peer_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          attempt_count: number | null
          block_reason: string | null
          blocked_until: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: string
          is_blocked: boolean | null
          metadata: Json | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          block_reason?: string | null
          blocked_until?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          block_reason?: string | null
          blocked_until?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_chats: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          product_id: string | null
          seller_id: string
          sender_type: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          product_id?: string | null
          seller_id: string
          sender_type?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          product_id?: string | null
          seller_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_chats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_chats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_orders: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          credentials: string | null
          delivered_at: string | null
          id: string
          product_id: string
          seller_earning: number
          seller_id: string
          status: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          credentials?: string | null
          delivered_at?: string | null
          id?: string
          product_id: string
          seller_earning: number
          seller_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          credentials?: string | null
          delivered_at?: string | null
          id?: string
          product_id?: string
          seller_earning?: number
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_approved: boolean | null
          is_available: boolean | null
          name: string
          price: number
          seller_id: string
          sold_count: number | null
          stock: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          name: string
          price?: number
          seller_id: string
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          name?: string
          price?: number
          seller_id?: string
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          total_orders: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seller_wallets: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          pending_balance: number
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          pending_balance?: number
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          pending_balance?: number
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_wallets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_withdrawals: {
        Row: {
          account_details: string
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          processed_at: string | null
          seller_id: string
          status: string | null
        }
        Insert: {
          account_details: string
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          processed_at?: string | null
          seller_id: string
          status?: string | null
        }
        Update: {
          account_details?: string
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          processed_at?: string | null
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_withdrawals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sender_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sender_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sender_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          security_alerts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          security_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          security_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active: string | null
          location: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active?: string | null
          location?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active?: string | null
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          payment_gateway: string | null
          status: string
          transaction_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          payment_gateway?: string | null
          status?: string
          transaction_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_gateway?: string | null
          status?: string
          transaction_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pro_user: { Args: { _user_id: string }; Returns: boolean }
      is_seller: { Args: { _user_id: string }; Returns: boolean }
      purchase_ai_account: {
        Args: {
          p_account_id: string
          p_account_name: string
          p_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      verify_admin_password: {
        Args: { p_password: string; p_username: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "seller"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "seller"],
    },
  },
} as const
