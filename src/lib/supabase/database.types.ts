// CURATED types — source of truth for the app. Hand-maintained so we keep the
// strong union aliases below (UserRole/BookingStatus/PaymentStatus) and the RPC
// signatures. The DB stores these as TEXT + CHECK constraints (not Postgres
// enums), so `supabase gen types` would widen them to `string` — that's why we
// don't auto-generate over this file.
//
// To check for schema drift, run `npm run db:types` (requires `supabase link`
// and SUPABASE_PROJECT_ID); it writes database.generated.ts, which you can diff
// against this file. To make generated types as strong as these, convert the
// status/role columns to real Postgres enum types first.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "auto_ecole" | "admin";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending_deposit" | "deposit_paid" | "fully_paid" | "refunded";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          date_naissance: string | null;
          ville_naissance: string | null;
          adresse: string | null;
          complement_adresse: string | null;
          code_postal: string | null;
          reason: string | null;
          has_permit: boolean | null;
          transmission_preference: "auto" | "manuelle" | null;
          has_code: boolean | null;
          neph_number: string | null;
          quiz_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: UserRole;
          date_naissance?: string | null;
          ville_naissance?: string | null;
          adresse?: string | null;
          complement_adresse?: string | null;
          code_postal?: string | null;
          reason?: string | null;
          has_permit?: boolean | null;
          transmission_preference?: "auto" | "manuelle" | null;
          has_code?: boolean | null;
          neph_number?: string | null;
          quiz_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: UserRole;
          date_naissance?: string | null;
          ville_naissance?: string | null;
          adresse?: string | null;
          complement_adresse?: string | null;
          code_postal?: string | null;
          reason?: string | null;
          has_permit?: boolean | null;
          transmission_preference?: "auto" | "manuelle" | null;
          has_code?: boolean | null;
          neph_number?: string | null;
          quiz_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      auto_ecoles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          region: string | null;
          postal_code: string;
          phone: string;
          email: string;
          website: string | null;
          license_types: string[];
          is_verified: boolean;
          commission_rate: number;
          rating: number;
          latitude: number | null;
          longitude: number | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          address: string;
          city: string;
          region?: string | null;
          postal_code: string;
          phone: string;
          email: string;
          website?: string | null;
          license_types?: string[];
          is_verified?: boolean;
          commission_rate?: number;
          rating?: number;
          latitude?: number | null;
          longitude?: number | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          address?: string;
          city?: string;
          region?: string | null;
          postal_code?: string;
          phone?: string;
          email?: string;
          website?: string | null;
          license_types?: string[];
          is_verified?: boolean;
          commission_rate?: number;
          rating?: number;
          latitude?: number | null;
          longitude?: number | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          id: string;
          auto_ecole_id: string;
          title: string;
          stage_type: string | null;
          description: string | null;
          license_type: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          max_students: number;
          enrolled_students: number;
          price: number;
          deposit_amount: number;
          is_available: boolean;
          status: "active" | "cancelled" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auto_ecole_id: string;
          title: string;
          stage_type?: string | null;
          description?: string | null;
          license_type?: string;
          start_date: string;
          end_date: string;
          duration_days?: number;
          max_students?: number;
          enrolled_students?: number;
          price: number;
          deposit_amount?: number;
          is_available?: boolean;
          status?: "active" | "cancelled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auto_ecole_id?: string;
          title?: string;
          stage_type?: string | null;
          description?: string | null;
          license_type?: string;
          start_date?: string;
          end_date?: string;
          duration_days?: number;
          max_students?: number;
          enrolled_students?: number;
          price?: number;
          deposit_amount?: number;
          is_available?: boolean;
          status?: "active" | "cancelled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          stage_id: string;
          status: BookingStatus;
          total_price: number;
          deposit_paid: number;
          balance_due: number;
          payment_status: PaymentStatus;
          stripe_session_id: string | null;
          metadata: Json | null;
          notes: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          confirmation_email_sent_at: string | null;
          receipt_email_sent_at: string | null;
          auto_ecole_notified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stage_id: string;
          status?: BookingStatus;
          total_price: number;
          deposit_paid?: number;
          balance_due: number;
          payment_status?: PaymentStatus;
          stripe_session_id?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          confirmation_email_sent_at?: string | null;
          receipt_email_sent_at?: string | null;
          auto_ecole_notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stage_id?: string;
          status?: BookingStatus;
          total_price?: number;
          deposit_paid?: number;
          balance_due?: number;
          payment_status?: PaymentStatus;
          stripe_session_id?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          confirmation_email_sent_at?: string | null;
          receipt_email_sent_at?: string | null;
          auto_ecole_notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          auto_ecole_id: string;
          booking_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          auto_ecole_id: string;
          booking_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          auto_ecole_id?: string;
          booking_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          name: string;
          city: string | null;
          license_type: string | null;
          preferred_start_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          name: string;
          city?: string | null;
          license_type?: string | null;
          preferred_start_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          name?: string;
          city?: string | null;
          license_type?: string | null;
          preferred_start_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      register_auto_ecole: {
        Args: {
          p_user_id: string;
          p_email: string;
          p_responsible_name: string;
          p_phone: string;
          p_auto_ecole_name: string;
          p_address: string;
          p_city: string;
          p_postal_code: string;
        };
        Returns: string;
      };
      expire_stale_pending_bookings: {
        Args: {
          p_max_age?: string;
        };
        Returns: number;
      };
      reserve_booking_for_checkout: {
        Args: {
          p_user_id: string;
          p_stage_id: string;
          p_metadata?: Json | null;
          p_exam_support_price?: number | null;
        };
        Returns: {
          booking_id: string;
          total_price: number;
          stage_title: string;
          stage_type: string | null;
        }[];
      };
      search_stages: {
        Args: {
          search_region?: string | null;
          search_stage_type?: string | null;
          search_license_type?: string | null;
          search_start_date?: string | null;
          search_end_date?: string | null;
          max_price?: number | null;
        };
        Returns: {
          stage_id: string;
          stage_title: string;
          stage_description: string | null;
          license_type: string;
          start_date: string;
          end_date: string;
          price: number;
          max_students: number;
          enrolled_students: number;
          available_spots: number;
          auto_ecole_id: string;
          auto_ecole_name: string;
          auto_ecole_region: string;
          auto_ecole_rating: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
