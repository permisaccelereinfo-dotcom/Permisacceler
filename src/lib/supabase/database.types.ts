export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: "student" | "auto_ecole" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: "student" | "auto_ecole" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: "student" | "auto_ecole" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      auto_ecoles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          postal_code: string;
          phone: string;
          email: string;
          website: string | null;
          license_types: string[];
          is_verified: boolean;
          commission_rate: number;
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
          postal_code: string;
          phone: string;
          email: string;
          website?: string | null;
          license_types?: string[];
          is_verified?: boolean;
          commission_rate?: number;
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
          postal_code?: string;
          phone?: string;
          email?: string;
          website?: string | null;
          license_types?: string[];
          is_verified?: boolean;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      stages: {
        Row: {
          id: string;
          auto_ecole_id: string;
          title: string;
          description: string | null;
          license_type: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          max_students: number;
          price: number;
          deposit_amount: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auto_ecole_id: string;
          title: string;
          description?: string | null;
          license_type: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          max_students?: number;
          price: number;
          deposit_amount?: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auto_ecole_id?: string;
          title?: string;
          description?: string | null;
          license_type?: string;
          start_date?: string;
          end_date?: string;
          duration_days?: number;
          max_students?: number;
          price?: number;
          deposit_amount?: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          stage_id: string;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          total_price: number;
          deposit_paid: number;
          balance_due: number;
          payment_status: "pending_deposit" | "deposit_paid" | "fully_paid";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stage_id: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          total_price: number;
          deposit_paid?: number;
          balance_due?: number;
          payment_status?: "pending_deposit" | "deposit_paid" | "fully_paid";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stage_id?: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          total_price?: number;
          deposit_paid?: number;
          balance_due?: number;
          payment_status?: "pending_deposit" | "deposit_paid" | "fully_paid";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
