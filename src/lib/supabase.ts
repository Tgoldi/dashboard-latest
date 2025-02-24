import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AssistantSettings {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    name: string;
    language: string;
    settings?: {
        voice_id?: string;
        initial_message?: string;
    };
} 