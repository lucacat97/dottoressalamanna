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
      ai_knowledge: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_active: boolean
          scope: string
          source_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          scope?: string
          source_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          scope?: string
          source_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          client_email: string | null
          client_name: string
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          monthly_limit: number
          tool_limits: Json | null
          tools: string[]
        }
        Insert: {
          client_email?: string | null
          client_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          monthly_limit?: number
          tool_limits?: Json | null
          tools?: string[]
        }
        Update: {
          client_email?: string | null
          client_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          monthly_limit?: number
          tool_limits?: Json | null
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
      checkup_questionnaires: {
        Row: {
          completed_at: string | null
          created_at: string
          current_section: string | null
          exam_date: string
          form_data: Json
          id: string
          notes_data: Json
          patient_birth_date: string | null
          patient_first_name: string
          patient_last_name: string
          patient_sex: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_section?: string | null
          exam_date?: string
          form_data?: Json
          id?: string
          notes_data?: Json
          patient_birth_date?: string | null
          patient_first_name?: string
          patient_last_name?: string
          patient_sex?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_section?: string | null
          exam_date?: string
          form_data?: Json
          id?: string
          notes_data?: Json
          patient_birth_date?: string | null
          patient_first_name?: string
          patient_last_name?: string
          patient_sex?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultation_downloads: {
        Row: {
          api_key_id: string | null
          consultation_type: string | null
          created_at: string
          download_count: number
          expires_at: string
          file_name: string
          file_path: string
          id: string
          last_downloaded_at: string | null
          max_downloads: number
          recipient_email: string
          token: string
        }
        Insert: {
          api_key_id?: string | null
          consultation_type?: string | null
          created_at?: string
          download_count?: number
          expires_at: string
          file_name: string
          file_path: string
          id?: string
          last_downloaded_at?: string | null
          max_downloads?: number
          recipient_email: string
          token: string
        }
        Update: {
          api_key_id?: string | null
          consultation_type?: string | null
          created_at?: string
          download_count?: number
          expires_at?: string
          file_name?: string
          file_path?: string
          id?: string
          last_downloaded_at?: string | null
          max_downloads?: number
          recipient_email?: string
          token?: string
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          attachments: Json
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_email: string
          user_full_name: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_full_name?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_full_name?: string | null
          user_id?: string
        }
        Relationships: []
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
          agenda: string | null
          cover_image_url: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          location: string | null
          long_description: string | null
          max_participants: number | null
          objectives: string | null
          price: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          agenda?: string | null
          cover_image_url?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          long_description?: string | null
          max_participants?: number | null
          objectives?: string | null
          price?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          agenda?: string | null
          cover_image_url?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          long_description?: string | null
          max_participants?: number | null
          objectives?: string | null
          price?: string | null
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
      course_media: {
        Row: {
          caption: string | null
          created_at: string
          edition_id: string
          id: string
          media_type: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          edition_id: string
          id?: string
          media_type: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          edition_id?: string
          id?: string
          media_type?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_media_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "course_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          confirmed: boolean
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
          confirmed?: boolean
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
          confirmed?: boolean
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          api_key_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          monthly_limit: number
          note: string | null
          status: string
          token: string
          tool_limits: Json
          tools: string[]
        }
        Insert: {
          accepted_at?: string | null
          api_key_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          monthly_limit?: number
          note?: string | null
          status?: string
          token: string
          tool_limits?: Json
          tools?: string[]
        }
        Update: {
          accepted_at?: string | null
          api_key_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          monthly_limit?: number
          note?: string | null
          status?: string
          token?: string
          tool_limits?: Json
          tools?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_screenings: {
        Row: {
          answers: Json
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          score: number
          source: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          score?: number
          source?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          score?: number
          source?: string | null
        }
        Relationships: []
      }
      posturographic_checkups: {
        Row: {
          created_at: string
          data: Json
          exam_date: string
          id: string
          patient_first_name: string
          patient_last_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          exam_date?: string
          id?: string
          patient_first_name: string
          patient_last_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          exam_date?: string
          id?: string
          patient_first_name?: string
          patient_last_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tool_feedback: {
        Row: {
          created_at: string
          feedback: string
          id: string
          is_active: boolean
          submitted_by: string
          submitted_by_email: string | null
          tool_name: string
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: string
          is_active?: boolean
          submitted_by: string
          submitted_by_email?: string | null
          tool_name: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          is_active?: boolean
          submitted_by?: string
          submitted_by_email?: string | null
          tool_name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_active_ai_knowledge: {
        Args: { _scope: string }
        Returns: {
          content: string
          scope: string
          title: string
        }[]
      }
      get_api_key_monthly_usage: {
        Args: { _api_key_id: string; _tool_name: string }
        Returns: number
      }
      get_auth_email: { Args: never; Returns: string }
      get_monthly_ai_usage: {
        Args: { _tool_name: string; _user_id: string }
        Returns: number
      }
      get_tool_feedback: {
        Args: { _tool_name: string }
        Returns: {
          created_at: string
          feedback: string
        }[]
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
