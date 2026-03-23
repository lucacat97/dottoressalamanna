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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          created_at: string
          id: string
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tool_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          client_name: string
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          monthly_limit: number
          tools: string[]
        }
        Insert: {
          client_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          monthly_limit?: number
          tools?: string[]
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          monthly_limit?: number
          tools?: string[]
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          api_key_id: string
          created_at: string
          id: string
          tool_name: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          id?: string
          tool_name: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          id?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      course_access_overrides: {
        Row: {
          created_at: string
          edition_id: string
          granted: boolean
          id: string
          user_email: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          granted?: boolean
          id?: string
          user_email: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          granted?: boolean
          id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_overrides_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "course_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_editions: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          location: string | null
          max_participants: number | null
          status: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      course_materials: {
        Row: {
          created_at: string
          edition_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "course_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          created_at: string
          edition_id: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          registered_by: string | null
        }
        Insert: {
          created_at?: string
          edition_id: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          registered_by?: string | null
        }
        Update: {
          created_at?: string
          edition_id?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "course_editions"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_api_key_monthly_usage: {
        Args: { _api_key_id: string; _tool_name: string }
        Returns: number
      }
      get_auth_email: { Args: never; Returns: string }
      get_monthly_ai_usage: {
        Args: { _tool_name: string; _user_id: string }
        Returns: number
      }
      has_course_access: {
        Args: { _edition_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
