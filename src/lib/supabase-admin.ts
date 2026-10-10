import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, NODE_ENV } from './env';

// This module holds the service-role key and bypasses RLS. It must only ever be
// loaded in server-side code; refuse to load in a browser.
if (typeof window !== 'undefined') {
    throw new Error('supabase-admin must not be imported in browser code. Use an authenticated server endpoint instead.');
}

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!SUPABASE_SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY');

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Development connectivity check (no user data is read; head-only count of a
// non-sensitive nature is avoided to keep service-role queries out of this module)
if (NODE_ENV === 'development') {
    console.log('Supabase Admin Client initialized (server-side only)');
}