import dotenv from 'dotenv';
import path from 'path';

// Load environment variables in Node.js environment
if (typeof process !== 'undefined' && process.env) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// Helper function to get environment variables that works in both browser and Node.js
const getEnvVar = (key: string): string => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
        return (import.meta.env[key] || '') as string;
    }
    // Node.js environment
    return process.env[key] || '';
};

// Supabase configuration
export const SUPABASE_URL = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_KEY = getEnvVar('SUPABASE_SERVICE_KEY') || getEnvVar('VITE_SUPABASE_SERVICE_KEY');

// VAPI configuration
export const VAPI_PRIVATE_KEY = getEnvVar('VAPI_PRIVATE_KEY') || getEnvVar('VITE_VAPI_PRIVATE_KEY');

// Other configuration
export const API_URL = getEnvVar('API_URL') || getEnvVar('VITE_API_URL');
export const NODE_ENV = getEnvVar('NODE_ENV');

// JWT configuration
export const JWT_SECRET = getEnvVar('JWT_SECRET');

// Validate required environment variables
const requiredVars = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY,
    VAPI_PRIVATE_KEY,
    API_URL,
    JWT_SECRET
};

// Only validate environment variables in Node.js environment
if (typeof process !== 'undefined' && process.env) {
    Object.entries(requiredVars).forEach(([key, value]) => {
        if (!value) {
            console.error(`Missing required environment variable: ${key}`);
        }
    });
} 