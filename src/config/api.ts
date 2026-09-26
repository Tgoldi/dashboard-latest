export const API_CONFIG = {
    VAPI: {
        PRIVATE_KEY: process.env.VAPI_PRIVATE_KEY,
        PUBLIC_KEY: process.env.VAPI_PUBLIC_KEY
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