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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attestations: {
        Row: {
          auditor_id: string | null
          auditor_sign_off: boolean | null
          booking_id: string
          created_at: string
          facility_sign_off: boolean | null
          file_path: string | null
          id: string
          notes: string | null
          result: Database["public"]["Enums"]["attestation_result"] | null
          updated_at: string
        }
        Insert: {
          auditor_id?: string | null
          auditor_sign_off?: boolean | null
          booking_id: string
          created_at?: string
          facility_sign_off?: boolean | null
          file_path?: string | null
          id?: string
          notes?: string | null
          result?: Database["public"]["Enums"]["attestation_result"] | null
          updated_at?: string
        }
        Update: {
          auditor_id?: string | null
          auditor_sign_off?: boolean | null
          booking_id?: string
          created_at?: string
          facility_sign_off?: boolean | null
          file_path?: string | null
          id?: string
          notes?: string | null
          result?: Database["public"]["Enums"]["attestation_result"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attestations_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attestations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_id: string
          category: string
          created_at: string
          description: string
          id: string
          recommendation: string
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          audit_id: string
          category: string
          created_at?: string
          description: string
          id?: string
          recommendation: string
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
        }
        Update: {
          audit_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          recommendation?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audit_id: string
          compliance_score: number | null
          created_at: string
          id: string
          overall_rating: string
          quality_score: number | null
          report_file_url: string | null
          safety_score: number | null
          summary: string
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audit_id: string
          compliance_score?: number | null
          created_at?: string
          id?: string
          overall_rating: string
          quality_score?: number | null
          report_file_url?: string | null
          safety_score?: number | null
          summary: string
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audit_id?: string
          compliance_score?: number | null
          created_at?: string
          id?: string
          overall_rating?: string
          quality_score?: number | null
          report_file_url?: string | null
          safety_score?: number | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_tasks: {
        Row: {
          assigned_date: string
          audit_type: string
          auditor_id: string | null
          booking_id: string
          completion_date: string | null
          created_at: string
          documents_count: number | null
          due_date: string
          facility_id: string
          id: string
          priority: string
          progress: number | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_date?: string
          audit_type: string
          auditor_id?: string | null
          booking_id: string
          completion_date?: string | null
          created_at?: string
          documents_count?: number | null
          due_date: string
          facility_id: string
          id?: string
          priority?: string
          progress?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          audit_type?: string
          auditor_id?: string | null
          booking_id?: string
          completion_date?: string | null
          created_at?: string
          documents_count?: number | null
          due_date?: string
          facility_id?: string
          id?: string
          priority?: string
          progress?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_tasks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_transactions: {
        Row: {
          block_number: number | null
          booking_id: string | null
          created_at: string
          from_address: string | null
          gas_price: number | null
          gas_used: number | null
          id: string
          status: string
          to_address: string | null
          tx_hash: string
          type: string
          updated_at: string
          value_wei: string | null
        }
        Insert: {
          block_number?: number | null
          booking_id?: string | null
          created_at?: string
          from_address?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          status?: string
          to_address?: string | null
          tx_hash: string
          type: string
          updated_at?: string
          value_wei?: string | null
        }
        Update: {
          block_number?: number | null
          booking_id?: string | null
          created_at?: string
          from_address?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          status?: string
          to_address?: string | null
          tx_hash?: string
          type?: string
          updated_at?: string
          value_wei?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_vertical: string | null
          buyer_id: string
          created_at: string
          facility_type: string | null
          fee_breakdown: Json | null
          finance_flag: boolean | null
          id: string
          insurance_flag: boolean | null
          is_priority: boolean | null
          payment_method: string | null
          payment_session_id: string | null
          payment_status: string | null
          requires_insurance: boolean | null
          requires_tokenization: boolean | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_vertical?: string | null
          buyer_id: string
          created_at?: string
          facility_type?: string | null
          fee_breakdown?: Json | null
          finance_flag?: boolean | null
          id?: string
          insurance_flag?: boolean | null
          is_priority?: boolean | null
          payment_method?: string | null
          payment_session_id?: string | null
          payment_status?: string | null
          requires_insurance?: boolean | null
          requires_tokenization?: boolean | null
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          booking_vertical?: string | null
          buyer_id?: string
          created_at?: string
          facility_type?: string | null
          fee_breakdown?: Json | null
          finance_flag?: boolean | null
          id?: string
          insurance_flag?: boolean | null
          is_priority?: boolean | null
          payment_method?: string | null
          payment_session_id?: string | null
          payment_status?: string | null
          requires_insurance?: boolean | null
          requires_tokenization?: boolean | null
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          avatar_url: string | null
          booking_id: string | null
          created_at: string
          id: string
          name: string
          participants: string[]
          type: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          name: string
          participants?: string[]
          type: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          name?: string
          participants?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          message: string
          message_type: string
          read_by: Json | null
          sender_avatar_url: string | null
          sender_id: string
          sender_name: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message: string
          message_type?: string
          read_by?: Json | null
          sender_avatar_url?: string | null
          sender_id: string
          sender_name: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message?: string
          message_type?: string
          read_by?: Json | null
          sender_avatar_url?: string | null
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          booking_id: string
          created_at: string
          fraction: number | null
          id: string
          owner_id: string
          resale_listing_id: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          token_id: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          fraction?: number | null
          id?: string
          owner_id: string
          resale_listing_id?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          token_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          fraction?: number | null
          id?: string
          owner_id?: string
          resale_listing_id?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          token_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crypto_escrows: {
        Row: {
          amount: number
          booking_id: string
          buyer_address: string
          confirmed_at: string | null
          created_at: string
          dispute_winner: string | null
          disputed_at: string | null
          facility_address: string
          funded_at: string | null
          funding_tx_hash: string | null
          id: string
          network: string
          release_tx_hash: string | null
          released_at: string | null
          resolved_at: string | null
          status: string
          token_address: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          buyer_address: string
          confirmed_at?: string | null
          created_at?: string
          dispute_winner?: string | null
          disputed_at?: string | null
          facility_address: string
          funded_at?: string | null
          funding_tx_hash?: string | null
          id?: string
          network?: string
          release_tx_hash?: string | null
          released_at?: string | null
          resolved_at?: string | null
          status?: string
          token_address: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          buyer_address?: string
          confirmed_at?: string | null
          created_at?: string
          dispute_winner?: string | null
          disputed_at?: string | null
          facility_address?: string
          funded_at?: string | null
          funding_tx_hash?: string | null
          id?: string
          network?: string
          release_tx_hash?: string | null
          released_at?: string | null
          resolved_at?: string | null
          status?: string
          token_address?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_escrows_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          cancellation_rate: number | null
          certifications: string[] | null
          created_at: string
          description: string | null
          id: string
          location: string
          name: string
          on_time_percentage: number | null
          owner_user_id: string
          qa_pass_rate: number | null
          reputation_score: number | null
          status: Database["public"]["Enums"]["facility_status"] | null
          updated_at: string
        }
        Insert: {
          cancellation_rate?: number | null
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          location: string
          name: string
          on_time_percentage?: number | null
          owner_user_id: string
          qa_pass_rate?: number | null
          reputation_score?: number | null
          status?: Database["public"]["Enums"]["facility_status"] | null
          updated_at?: string
        }
        Update: {
          cancellation_rate?: number | null
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          on_time_percentage?: number | null
          owner_user_id?: string
          qa_pass_rate?: number | null
          reputation_score?: number | null
          status?: Database["public"]["Enums"]["facility_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      facility_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          facility_id: string
          id: string
          monthly_price: number
          status: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          facility_id: string
          id?: string
          monthly_price: number
          status?: string
          subscription_tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          facility_id?: string
          id?: string
          monthly_price?: number
          status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_subscriptions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          admin_notes: string | null
          approved_amount: number | null
          booking_id: string
          claim_amount: number
          claim_type: string
          claimant_id: string
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          payout_tx_hash: string | null
          processed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_amount?: number | null
          booking_id: string
          claim_amount: number
          claim_type: string
          claimant_id: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          payout_tx_hash?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_amount?: number | null
          booking_id?: string
          claim_amount?: number
          claim_type?: string
          claimant_id?: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          payout_tx_hash?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_claimant_id_fkey"
            columns: ["claimant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          urgent: boolean | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          urgent?: boolean | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          urgent?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          reputation_score: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          verification_status: boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          reputation_score?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          verification_status?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          reputation_score?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          verification_status?: boolean | null
        }
        Relationships: []
      }
      resale_listings: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"] | null
          updated_at: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          price: number
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resale_listings_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      revenue_analytics: {
        Row: {
          auditor_network_fee: number
          base_amount: number
          booking_commission: number
          booking_id: string | null
          booking_vertical: string
          buyer_id: string
          created_at: string
          escrow_service_fee: number
          facility_id: string
          facility_type: string
          id: string
          insurance_pool_fee: number
          net_to_facility: number
          payment_method: string
          priority_matching_fee: number
          revenue_date: string
          stablecoin_settlement_fee: number
          tokenization_fee: number
          total_fees: number
          updated_at: string
        }
        Insert: {
          auditor_network_fee?: number
          base_amount: number
          booking_commission?: number
          booking_id?: string | null
          booking_vertical: string
          buyer_id: string
          created_at?: string
          escrow_service_fee?: number
          facility_id: string
          facility_type: string
          id?: string
          insurance_pool_fee?: number
          net_to_facility: number
          payment_method: string
          priority_matching_fee?: number
          revenue_date?: string
          stablecoin_settlement_fee?: number
          tokenization_fee?: number
          total_fees: number
          updated_at?: string
        }
        Update: {
          auditor_network_fee?: number
          base_amount?: number
          booking_commission?: number
          booking_id?: string | null
          booking_vertical?: string
          buyer_id?: string
          created_at?: string
          escrow_service_fee?: number
          facility_id?: string
          facility_type?: string
          id?: string
          insurance_pool_fee?: number
          net_to_facility?: number
          payment_method?: string
          priority_matching_fee?: number
          revenue_date?: string
          stablecoin_settlement_fee?: number
          tokenization_fee?: number
          total_fees?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_analytics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_analytics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_settings: {
        Row: {
          created_at: string
          fee_rates: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          fee_rates?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          fee_rates?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      slot_nfts: {
        Row: {
          booking_id: string
          contract_address: string | null
          created_at: string
          id: string
          metadata: Json | null
          minted_at: string
          network: string
          owner_address: string
          token_id: number | null
          transferred_at: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          contract_address?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          minted_at?: string
          network?: string
          owner_address: string
          token_id?: number | null
          transferred_at?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          contract_address?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          minted_at?: string
          network?: string
          owner_address?: string
          token_id?: number | null
          transferred_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_nfts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          cancellation_policy: string | null
          compliance_level: Database["public"]["Enums"]["compliance_level"]
          created_at: string
          description: string | null
          duration_hours: number
          end_date: string
          equipment: string
          facility_id: string
          id: string
          is_available: boolean | null
          price: number
          qa_deliverables: string | null
          scale_capacity: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          compliance_level: Database["public"]["Enums"]["compliance_level"]
          created_at?: string
          description?: string | null
          duration_hours: number
          end_date: string
          equipment: string
          facility_id: string
          id?: string
          is_available?: boolean | null
          price: number
          qa_deliverables?: string | null
          scale_capacity?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          compliance_level?: Database["public"]["Enums"]["compliance_level"]
          created_at?: string
          description?: string | null
          duration_hours?: number
          end_date?: string
          equipment?: string
          facility_id?: string
          id?: string
          is_available?: boolean | null
          price?: number
          qa_deliverables?: string | null
          scale_capacity?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          blockchain_tx_hash: string | null
          booking_id: string | null
          created_at: string
          id: string
          payee_id: string
          payer_id: string
          payment_method: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          blockchain_tx_hash?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          payee_id: string
          payer_id: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          blockchain_tx_hash?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          payee_id?: string
          payer_id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      attestation_result: "passed" | "failed" | "pending"
      booking_status:
        | "reserved"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      claim_status: "active" | "listed_for_sale" | "sold" | "fractionalized"
      compliance_level: "rd" | "gmp" | "gcp"
      facility_status: "pending" | "approved" | "rejected" | "suspended"
      listing_status: "active" | "sold" | "cancelled"
      user_role: "buyer" | "facility" | "auditor" | "admin"
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
      attestation_result: ["passed", "failed", "pending"],
      booking_status: [
        "reserved",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      claim_status: ["active", "listed_for_sale", "sold", "fractionalized"],
      compliance_level: ["rd", "gmp", "gcp"],
      facility_status: ["pending", "approved", "rejected", "suspended"],
      listing_status: ["active", "sold", "cancelled"],
      user_role: ["buyer", "facility", "auditor", "admin"],
    },
  },
} as const
