export const API_CONFIG = {
    VAPI: {
        // Private key must only be set in a server-side environment variable
        // (never exposed to the client bundle); proxy private calls via a backend.
        PRIVATE_KEY: (process.env.VAPI_PRIVATE_KEY ?? '') as string,
        // Public (restricted) key may be shipped to the client.
        PUBLIC_KEY: (process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? '') as string
    }
} as const;

// Base URLs for different environments
export const API_URLS = {
    development: 'https://api.vapi.ai',
    production: 'https://api.vapi.ai'
} as const;

export const getApiUrl = () => {
    return process.env.NODE_ENV === 'production' ? API_URLS.production : API_URLS.development;
}; 