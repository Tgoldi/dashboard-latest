import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, NODE_ENV } from './env';

// Helper function to get environment variables that works in both browser and Node.js
const getEnvVar = (key: string): string => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
        return import.meta.env[key] || '';
    }
    // Node.js environment
    return process.env[key] || '';
};

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!SUPABASE_SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY');

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Add error logging for development
if (NODE_ENV === 'development') {
    supabaseAdmin.from('users').select('count').then(({ count, error }) => {
        if (error) {
            console.error('Supabase Admin Client Error:', error);
        } else {
            console.log('Supabase Admin Client Connected, Total Users:', count);
        }
    });
} 