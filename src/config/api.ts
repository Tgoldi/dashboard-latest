export const API_CONFIG = {
    VAPI: {
        PRIVATE_KEY: 'eb6fdcc2-d70b-456f-a0fd-0101bbd09545',
        PUBLIC_KEY: '6ed82e9d-e247-4a7e-9282-36a0d67f4cb3'
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