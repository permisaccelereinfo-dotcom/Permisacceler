export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "auto_ecole" | "admin";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending_deposit" | "deposit_paid" | "fully_paid";

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
