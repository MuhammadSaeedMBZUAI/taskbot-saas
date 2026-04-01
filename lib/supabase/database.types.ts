export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone_number: string | null;
          stripe_customer_id: string | null;
          subscription_status: "free" | "active" | "canceled" | "past_due";
          subscription_tier: "free" | "pro";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          phone_number?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: "free" | "active" | "canceled" | "past_due";
          subscription_tier?: "free" | "pro";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone_number?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: "free" | "active" | "canceled" | "past_due";
          subscription_tier?: "free" | "pro";
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "pending" | "in_progress" | "completed";
          priority: "low" | "medium" | "high";
          due_date: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_sessions: {
        Row: {
          id: string;
          phone_number: string;
          user_id: string | null;
          context: Json;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          user_id?: string | null;
          context?: Json;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          user_id?: string | null;
          context?: Json;
          last_message_at?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
