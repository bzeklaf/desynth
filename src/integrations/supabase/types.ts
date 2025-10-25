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
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
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
      market_listings: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          listed_at: string
          listing_price: number
          original_booking_id: string | null
          original_price: number
          seller_id: string
          seller_type: string
          slot_id: string
          sold_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          listed_at?: string
          listing_price: number
          original_booking_id?: string | null
          original_price: number
          seller_id: string
          seller_type: string
          slot_id: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          listed_at?: string
          listing_price?: number
          original_booking_id?: string | null
          original_price?: number
          seller_id?: string
          seller_type?: string
          slot_id?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      market_transactions: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          payment_method: string | null
          payment_status: string
          platform_fee: number
          seller_id: string
          seller_net_amount: number
          slot_id: string
          transaction_amount: number
          transaction_date: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          payment_method?: string | null
          payment_status?: string
          platform_fee?: number
          seller_id: string
          seller_net_amount: number
          slot_id: string
          transaction_amount: number
          transaction_date?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          payment_method?: string | null
          payment_status?: string
          platform_fee?: number
          seller_id?: string
          seller_net_amount?: number
          slot_id?: string
          transaction_amount?: number
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_transactions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
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
      expire_old_market_listings: { Args: never; Returns: undefined }
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
      attestation_result: "pending" | "passed" | "failed"
      booking_status:
        | "reserved"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      claim_status: "active" | "listed" | "sold" | "redeemed"
      compliance_level: "basic" | "gmp" | "fda" | "iso"
      facility_status: "pending" | "approved" | "suspended"
      listing_status: "active" | "sold" | "cancelled"
      user_role: "admin" | "auditor" | "facility" | "buyer"
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
      attestation_result: ["pending", "passed", "failed"],
      booking_status: [
        "reserved",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      claim_status: ["active", "listed", "sold", "redeemed"],
      compliance_level: ["basic", "gmp", "fda", "iso"],
      facility_status: ["pending", "approved", "suspended"],
      listing_status: ["active", "sold", "cancelled"],
      user_role: ["admin", "auditor", "facility", "buyer"],
    },
  },
} as const
