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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
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
      admin_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          ip_address: string
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          ip_address?: string
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
          chat_allowed: boolean | null
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
          product_type: string | null
          slug: string | null
          sold_count: number | null
          stock: number | null
          tags: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          chat_allowed?: boolean | null
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
          product_type?: string | null
          slug?: string | null
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          chat_allowed?: boolean | null
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
          product_type?: string | null
          slug?: string | null
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
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
      auto_approval_settings: {
        Row: {
          auto_approve_all: boolean | null
          auto_approve_verified_only: boolean | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_approve_all?: boolean | null
          auto_approve_verified_only?: boolean | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_approve_all?: boolean | null
          auto_approve_verified_only?: boolean | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      broadcast_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          link: string | null
          message: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          target_audience: string | null
          title: string
          total_clicked: number | null
          total_failed: number | null
          total_sent: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          link?: string | null
          message: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          total_clicked?: number | null
          total_failed?: number | null
          total_sent?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          link?: string | null
          message?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          total_clicked?: number | null
          total_failed?: number | null
          total_sent?: number | null
        }
        Relationships: []
      }
      buyer_payment_accounts: {
        Row: {
          account_details: Json | null
          account_name: string
          account_number: string
          bank_name: string | null
          country: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          payment_method_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_details?: Json | null
          account_name: string
          account_number: string
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          payment_method_code: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_details?: Json | null
          account_name?: string
          account_number?: string
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          payment_method_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      buyer_wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          product_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          product_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          product_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      buyer_withdrawal_otps: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          payment_account_id: string
          user_id: string
          verified: boolean | null
          withdrawal_amount: number
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          payment_account_id: string
          user_id: string
          verified?: boolean | null
          withdrawal_amount: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          payment_account_id?: string
          user_id?: string
          verified?: boolean | null
          withdrawal_amount?: number
        }
        Relationships: []
      }
      buyer_withdrawals: {
        Row: {
          account_details: string
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          processed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_details: string
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          processed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_details?: string
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          processed_at?: string | null
          status?: string | null
          user_id?: string
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
      chat_join_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          buyer_id: string
          created_at: string | null
          description: string | null
          id: string
          reason: string
          resolved_at: string | null
          seller_id: string
          status: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          buyer_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          seller_id: string
          status?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          buyer_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          seller_id?: string
          status?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          seller_id: string | null
          type: string | null
          used_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          seller_id?: string | null
          type?: string | null
          used_count?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          seller_id?: string | null
          type?: string | null
          used_count?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          email_enabled: boolean
          id: string
          marketing_emails_enabled: boolean
          order_emails_enabled: boolean
          security_emails_enabled: boolean
          updated_at: string | null
          updated_by: string | null
          wallet_emails_enabled: boolean
        }
        Insert: {
          email_enabled?: boolean
          id?: string
          marketing_emails_enabled?: boolean
          order_emails_enabled?: boolean
          security_emails_enabled?: boolean
          updated_at?: string | null
          updated_by?: string | null
          wallet_emails_enabled?: boolean
        }
        Update: {
          email_enabled?: boolean
          id?: string
          marketing_emails_enabled?: boolean
          order_emails_enabled?: boolean
          security_emails_enabled?: boolean
          updated_at?: string | null
          updated_by?: string | null
          wallet_emails_enabled?: boolean
        }
        Relationships: []
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
      flash_sales: {
        Row: {
          created_at: string | null
          discount_percentage: number
          ends_at: string
          id: string
          is_active: boolean | null
          max_quantity: number | null
          original_price: number
          product_id: string
          sale_price: number
          seller_id: string
          sold_quantity: number | null
          starts_at: string
        }
        Insert: {
          created_at?: string | null
          discount_percentage: number
          ends_at: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          original_price: number
          product_id: string
          sale_price: number
          seller_id: string
          sold_quantity?: number | null
          starts_at: string
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number
          ends_at?: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          original_price?: number
          product_id?: string
          sale_price?: number
          seller_id?: string
          sold_quantity?: number | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          device_info: string | null
          id: string
          ip_address: string | null
          location: string | null
          logged_in_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          device_info?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          device_info?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token_hash: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token_hash: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          api_key: string | null
          api_secret: string | null
          code: string
          countries: string[] | null
          created_at: string | null
          currency_code: string | null
          display_order: number | null
          exchange_rate: number | null
          icon_url: string | null
          id: string
          instructions: string | null
          is_automatic: boolean | null
          is_enabled: boolean | null
          max_withdrawal: number | null
          min_withdrawal: number | null
          name: string
          qr_image_url: string | null
          updated_at: string | null
          withdrawal_enabled: boolean | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          api_key?: string | null
          api_secret?: string | null
          code: string
          countries?: string[] | null
          created_at?: string | null
          currency_code?: string | null
          display_order?: number | null
          exchange_rate?: number | null
          icon_url?: string | null
          id?: string
          instructions?: string | null
          is_automatic?: boolean | null
          is_enabled?: boolean | null
          max_withdrawal?: number | null
          min_withdrawal?: number | null
          name: string
          qr_image_url?: string | null
          updated_at?: string | null
          withdrawal_enabled?: boolean | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          api_key?: string | null
          api_secret?: string | null
          code?: string
          countries?: string[] | null
          created_at?: string | null
          currency_code?: string | null
          display_order?: number | null
          exchange_rate?: number | null
          icon_url?: string | null
          id?: string
          instructions?: string | null
          is_automatic?: boolean | null
          is_enabled?: boolean | null
          max_withdrawal?: number | null
          min_withdrawal?: number | null
          name?: string
          qr_image_url?: string | null
          updated_at?: string | null
          withdrawal_enabled?: boolean | null
        }
        Relationships: []
      }
      platform_announcements: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          message: string
          starts_at: string | null
          target_audience: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          starts_at?: string | null
          target_audience?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          starts_at?: string | null
          target_audience?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          maintenance_mode: boolean | null
          min_withdrawal_amount: number | null
          platform_fee_percentage: number | null
          registration_enabled: boolean | null
          seller_registration_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          maintenance_mode?: boolean | null
          min_withdrawal_amount?: number | null
          platform_fee_percentage?: number | null
          registration_enabled?: boolean | null
          seller_registration_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          maintenance_mode?: boolean | null
          min_withdrawal_amount?: number | null
          platform_fee_percentage?: number | null
          registration_enabled?: boolean | null
          seller_registration_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      popular_searches: {
        Row: {
          category_id: string | null
          id: string
          is_trending: boolean | null
          last_searched_at: string | null
          query: string
          search_count: number | null
        }
        Insert: {
          category_id?: string | null
          id?: string
          is_trending?: boolean | null
          last_searched_at?: string | null
          query: string
          search_count?: number | null
        }
        Update: {
          category_id?: string | null
          id?: string
          is_trending?: boolean | null
          last_searched_at?: string | null
          query?: string
          search_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "popular_searches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_analytics: {
        Row: {
          clicks: number | null
          date: string
          id: string
          product_id: string
          purchases: number | null
          revenue: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          date: string
          id?: string
          product_id: string
          purchases?: number | null
          revenue?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          date?: string
          id?: string
          product_id?: string
          purchases?: number | null
          revenue?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          buyer_id: string
          content: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified_purchase: boolean | null
          order_id: string | null
          product_id: string
          rating: number
          seller_responded_at: string | null
          seller_response: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id: string
          rating: number
          seller_responded_at?: string | null
          seller_response?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id?: string
          rating?: number
          seller_responded_at?: string | null
          seller_response?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_pro: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_pro?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_pro?: boolean | null
          two_factor_enabled?: boolean | null
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
      push_config: {
        Row: {
          created_at: string | null
          id: string
          private_key: string
          public_key: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          private_key: string
          public_key: string
          subject?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          private_key?: string
          public_key?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_logs: {
        Row: {
          clicked_at: string | null
          error_message: string | null
          id: string
          link: string | null
          message: string | null
          notification_type: string | null
          sent_at: string | null
          status: string | null
          subscription_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          error_message?: string | null
          id?: string
          link?: string | null
          message?: string | null
          notification_type?: string | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          error_message?: string | null
          id?: string
          link?: string | null
          message?: string | null
          notification_type?: string | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
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
      recently_viewed: {
        Row: {
          id: string
          product_id: string
          product_type: string | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          product_type?: string | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          product_type?: string | null
          user_id?: string
          viewed_at?: string | null
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
      search_history: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          query: string
          result_count: number | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          query: string
          result_count?: number | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          query?: string
          result_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      search_synonyms: {
        Row: {
          created_at: string | null
          id: string
          synonyms: string[]
          term: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          synonyms?: string[]
          term: string
        }
        Update: {
          created_at?: string | null
          id?: string
          synonyms?: string[]
          term?: string
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
      seller_2fa_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          recovery_codes: string[] | null
          secret_key: string | null
          seller_id: string
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          recovery_codes?: string[] | null
          secret_key?: string | null
          seller_id: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          recovery_codes?: string[] | null
          secret_key?: string | null
          seller_id?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_2fa_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_2fa_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_chat_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          seller_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          seller_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "seller_support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_chat_attachments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_chat_attachments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_chats: {
        Row: {
          admin_joined: boolean | null
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
          admin_joined?: boolean | null
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
          admin_joined?: boolean | null
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
          {
            foreignKeyName: "seller_chats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_feature_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          seller_id: string
          status: string | null
          title: string
          updated_at: string | null
          votes: number | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          seller_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          votes?: number | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          seller_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_feature_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_feature_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_levels: {
        Row: {
          badge_color: string
          badge_icon: string | null
          benefits: Json | null
          commission_rate: number | null
          created_at: string | null
          display_order: number | null
          id: string
          min_orders: number | null
          min_rating: number | null
          min_revenue: number | null
          name: string
        }
        Insert: {
          badge_color?: string
          badge_icon?: string | null
          benefits?: Json | null
          commission_rate?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          min_orders?: number | null
          min_rating?: number | null
          min_revenue?: number | null
          name: string
        }
        Update: {
          badge_color?: string
          badge_icon?: string | null
          benefits?: Json | null
          commission_rate?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          min_orders?: number | null
          min_rating?: number | null
          min_revenue?: number | null
          name?: string
        }
        Relationships: []
      }
      seller_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          seller_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          seller_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          seller_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_notifications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_notifications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_orders: {
        Row: {
          amount: number
          buyer_approved: boolean | null
          buyer_email_input: string | null
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
          buyer_approved?: boolean | null
          buyer_email_input?: string | null
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
          buyer_approved?: boolean | null
          buyer_email_input?: string | null
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
          {
            foreignKeyName: "seller_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_payment_accounts: {
        Row: {
          account_details: Json | null
          account_name: string
          account_number: string
          bank_name: string | null
          country: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          payment_method_code: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          account_details?: Json | null
          account_name: string
          account_number: string
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          payment_method_code: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          account_details?: Json | null
          account_name?: string
          account_number?: string
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          payment_method_code?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_payment_accounts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_payment_accounts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_products: {
        Row: {
          category_id: string | null
          category_ids: string[] | null
          chat_allowed: boolean | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_available: boolean | null
          name: string
          price: number
          requires_email: boolean | null
          seller_id: string
          sold_count: number | null
          stock: number | null
          tags: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          category_ids?: string[] | null
          chat_allowed?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_available?: boolean | null
          name: string
          price?: number
          requires_email?: boolean | null
          seller_id: string
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          category_ids?: string[] | null
          chat_allowed?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_available?: boolean | null
          name?: string
          price?: number
          requires_email?: boolean | null
          seller_id?: string
          sold_count?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
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
          {
            foreignKeyName: "seller_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          auto_approve_products: boolean | null
          banner_height: string | null
          banner_type: string | null
          commission_rate: number | null
          country: string | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_verified: boolean | null
          level_id: string | null
          show_description: boolean | null
          show_order_count: boolean | null
          show_product_count: boolean | null
          show_reviews: boolean | null
          show_social_links: boolean | null
          social_links: Json | null
          store_banner_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          store_slug: string | null
          store_tagline: string | null
          store_video_url: string | null
          total_orders: number | null
          total_sales: number | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_approve_products?: boolean | null
          banner_height?: string | null
          banner_type?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_verified?: boolean | null
          level_id?: string | null
          show_description?: boolean | null
          show_order_count?: boolean | null
          show_product_count?: boolean | null
          show_reviews?: boolean | null
          show_social_links?: boolean | null
          social_links?: Json | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          store_slug?: string | null
          store_tagline?: string | null
          store_video_url?: string | null
          total_orders?: number | null
          total_sales?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_approve_products?: boolean | null
          banner_height?: string | null
          banner_type?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_verified?: boolean | null
          level_id?: string | null
          show_description?: boolean | null
          show_order_count?: boolean | null
          show_product_count?: boolean | null
          show_reviews?: boolean | null
          show_social_links?: boolean | null
          social_links?: Json | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          store_slug?: string | null
          store_tagline?: string | null
          store_video_url?: string | null
          total_orders?: number | null
          total_sales?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "seller_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reports: {
        Row: {
          admin_notes: string | null
          buyer_id: string
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          reason: string
          seller_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          buyer_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          reason: string
          seller_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          buyer_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          reason?: string
          seller_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_support_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          seller_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          seller_id: string
          sender_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          seller_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_support_messages_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_support_messages_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_traffic_analytics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          page_views: number | null
          seller_id: string | null
          source: string | null
          unique_visitors: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          page_views?: number | null
          seller_id?: string | null
          source?: string | null
          unique_visitors?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          page_views?: number | null
          seller_id?: string | null
          source?: string | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_traffic_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_traffic_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_trust_scores: {
        Row: {
          buyer_approved_count: number | null
          created_at: string | null
          id: string
          last_calculated: string | null
          resolved_reports: number | null
          seller_id: string
          successful_orders: number | null
          total_reports: number | null
          trust_score: number | null
        }
        Insert: {
          buyer_approved_count?: number | null
          created_at?: string | null
          id?: string
          last_calculated?: string | null
          resolved_reports?: number | null
          seller_id: string
          successful_orders?: number | null
          total_reports?: number | null
          trust_score?: number | null
        }
        Update: {
          buyer_approved_count?: number | null
          created_at?: string | null
          id?: string
          last_calculated?: string | null
          resolved_reports?: number | null
          seller_id?: string
          successful_orders?: number | null
          total_reports?: number | null
          trust_score?: number | null
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
          {
            foreignKeyName: "seller_wallets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles_public"
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
          payment_account_id: string | null
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
          payment_account_id?: string | null
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
          payment_account_id?: string | null
          payment_method?: string
          processed_at?: string | null
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_withdrawals_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "seller_payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_withdrawals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_withdrawals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
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
      user_2fa_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          recovery_codes: string[] | null
          secret_key: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          recovery_codes?: string[] | null
          secret_key?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          recovery_codes?: string[] | null
          secret_key?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_otps: {
        Row: {
          action_type: string
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          login_alerts: boolean | null
          marketing_emails: boolean | null
          order_emails: boolean | null
          product_emails: boolean | null
          security_alerts: boolean | null
          security_emails: boolean | null
          updated_at: string | null
          user_id: string
          wallet_emails: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          login_alerts?: boolean | null
          marketing_emails?: boolean | null
          order_emails?: boolean | null
          product_emails?: boolean | null
          security_alerts?: boolean | null
          security_emails?: boolean | null
          updated_at?: string | null
          user_id: string
          wallet_emails?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          login_alerts?: boolean | null
          marketing_emails?: boolean | null
          order_emails?: boolean | null
          product_emails?: boolean | null
          security_alerts?: boolean | null
          security_emails?: boolean | null
          updated_at?: string | null
          user_id?: string
          wallet_emails?: boolean | null
        }
        Relationships: []
      }
      user_product_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          product_id: string
          product_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          product_id: string
          product_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          product_id?: string
          product_type?: string
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
      withdrawal_method_config: {
        Row: {
          account_type: string
          brand_color: string | null
          country_code: string
          created_at: string | null
          custom_logo_url: string | null
          exchange_rate: number | null
          id: string
          is_enabled: boolean | null
          max_withdrawal: number | null
          method_code: string | null
          method_name: string | null
          min_withdrawal: number | null
          updated_at: string | null
        }
        Insert: {
          account_type: string
          brand_color?: string | null
          country_code: string
          created_at?: string | null
          custom_logo_url?: string | null
          exchange_rate?: number | null
          id?: string
          is_enabled?: boolean | null
          max_withdrawal?: number | null
          method_code?: string | null
          method_name?: string | null
          min_withdrawal?: number | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          brand_color?: string | null
          country_code?: string
          created_at?: string | null
          custom_logo_url?: string | null
          exchange_rate?: number | null
          id?: string
          is_enabled?: boolean | null
          max_withdrawal?: number | null
          method_code?: string | null
          method_name?: string | null
          min_withdrawal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      withdrawal_otps: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          payment_account_id: string
          seller_id: string
          verified: boolean | null
          withdrawal_amount: number
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          payment_account_id: string
          seller_id: string
          verified?: boolean | null
          withdrawal_amount: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          payment_account_id?: string
          seller_id?: string
          verified?: boolean | null
          withdrawal_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_otps_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_otps_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      payment_methods_public: {
        Row: {
          account_name: string | null
          account_number: string | null
          code: string | null
          created_at: string | null
          currency_code: string | null
          display_order: number | null
          exchange_rate: number | null
          icon_url: string | null
          id: string | null
          instructions: string | null
          is_automatic: boolean | null
          is_enabled: boolean | null
          max_withdrawal: number | null
          min_withdrawal: number | null
          name: string | null
          qr_image_url: string | null
          withdrawal_enabled: boolean | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          code?: string | null
          created_at?: string | null
          currency_code?: string | null
          display_order?: number | null
          exchange_rate?: number | null
          icon_url?: string | null
          id?: string | null
          instructions?: string | null
          is_automatic?: boolean | null
          is_enabled?: boolean | null
          max_withdrawal?: number | null
          min_withdrawal?: number | null
          name?: string | null
          qr_image_url?: string | null
          withdrawal_enabled?: boolean | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          code?: string | null
          created_at?: string | null
          currency_code?: string | null
          display_order?: number | null
          exchange_rate?: number | null
          icon_url?: string | null
          id?: string | null
          instructions?: string | null
          is_automatic?: boolean | null
          is_enabled?: boolean | null
          max_withdrawal?: number | null
          min_withdrawal?: number | null
          name?: string | null
          qr_image_url?: string | null
          withdrawal_enabled?: boolean | null
        }
        Relationships: []
      }
      seller_profiles_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          social_links: Json | null
          store_banner_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string | null
          store_slug: string | null
          store_tagline: string | null
          total_orders: number | null
          total_sales: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          social_links?: Json | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          store_slug?: string | null
          store_tagline?: string | null
          total_orders?: number | null
          total_sales?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          social_links?: Json | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          store_slug?: string | null
          store_tagline?: string | null
          total_orders?: number | null
          total_sales?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_seller_pending_balance: {
        Args: { p_amount: number; p_seller_id: string }
        Returns: undefined
      }
      approve_seller_delivery: {
        Args: { p_buyer_id: string; p_order_id: string }
        Returns: undefined
      }
      check_admin_rate_limit: { Args: { p_ip_address: string }; Returns: Json }
      clean_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      cleanup_expired_password_tokens: { Args: never; Returns: undefined }
      get_active_flash_sale: {
        Args: { p_product_id: string }
        Returns: {
          discount_percentage: number
          ends_at: string
          id: string
          max_quantity: number
          original_price: number
          sale_price: number
          sold_quantity: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_account_view: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      increment_product_view: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      increment_seller_product_view: {
        Args: { p_product_id: string }
        Returns: undefined
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
      purchase_pro_plan: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: Json
      }
      purchase_seller_product: {
        Args: {
          p_amount: number
          p_buyer_id: string
          p_product_id: string
          p_product_name: string
          p_seller_earning: number
          p_seller_id: string
        }
        Returns: Json
      }
      reset_admin_rate_limit: {
        Args: { p_ip_address: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_seller_level: { Args: { p_seller_id: string }; Returns: undefined }
      update_seller_trust_score: {
        Args: { p_seller_id: string }
        Returns: undefined
      }
      upsert_popular_search: {
        Args: { p_category_id?: string; p_query: string }
        Returns: undefined
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
