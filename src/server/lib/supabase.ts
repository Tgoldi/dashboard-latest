import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from '../../lib/env';

// Validate environment variables
const missingVars = [];
if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
if (!SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
if (!SUPABASE_SERVICE_KEY) missingVars.push('SUPABASE_SERVICE_KEY');

if (missingVars.length > 0) {
    console.error('Missing required Supabase environment variables:', missingVars.join(', '));
    console.error('Please ensure these variables are set in your .env file');
    process.exit(1);
}

// Create Supabase client with anon key for regular operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});

// Create Supabase admin client with service role key for admin operations
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    },
    global: {
        headers: {
            'x-client-info': 'supabase-js-admin'
        }
    }
});

// Add development logging
if (process.env.NODE_ENV === 'development') {
    supabaseAdmin.auth.onAuthStateChange((event, session) => {
        console.log('Supabase admin auth state changed:', event, session?.user?.id);
    });

    // Log client configuration
    console.log('Supabase Admin Client Configuration:', {
        url: SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_KEY
    });
} 