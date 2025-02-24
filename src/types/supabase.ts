export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    role: 'admin' | 'viewer';
                    assistant_access: 'single' | 'all';
                    language: string;
                    assigned_assistants: string[];
                    default_assistant_id: string | null;
                    questions: Record<string, any>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            assistants: {
                Row: {
                    id: string;
                    name: string;
                    description: string;
                    model: string;
                    temperature: number;
                    max_tokens: number;
                    system_prompt: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['assistants']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['assistants']['Insert']>;
            };
            transcripts: {
                Row: {
                    id: string;
                    assistant_id: string;
                    user_id: string;
                    content: string;
                    speaker: 'user' | 'assistant';
                    timestamp: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['transcripts']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['transcripts']['Insert']>;
            };
        };
    };
} 