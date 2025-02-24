import { Assistant } from "../types/assistant";
import { supabaseAdmin } from "./supabase-admin";

interface VapiAssistant {
    id: string;
    name?: string;
    description?: string;
    language?: string;
    model?: {
        name?: string;
        settings?: {
            temperature?: number;
            maxTokens?: number;
            systemPrompt?: string;
        };
    };
    settings?: {
        voice_id?: string;
        initial_message?: string;
        temperature?: number;
        maxTokens?: number;
    };
    orgId?: string;
    createdAt?: string;
    updatedAt?: string;
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

class VapiService {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = 'https://api.vapi.ai/api';
        this.apiKey = getEnvVar('VITE_VAPI_API_KEY') || getEnvVar('VAPI_PRIVATE_KEY') || '';

        if (!this.apiKey) {
            throw new Error('VAPI API key is required. Please set VITE_VAPI_API_KEY or VAPI_PRIVATE_KEY in your environment variables.');
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers,
        };

        console.log('Making request to:', url);
        console.log('Headers:', headers);

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        return response.json();
    }

    assistants = {
        list: async (): Promise<Assistant[]> => {
            const assistants = await this.request<VapiAssistant[]>('/assistant');
            return assistants.map(assistant => ({
                id: assistant.id,
                name: assistant.name || '',
                description: assistant.description || '',
                language: assistant.language || 'en',
                model: {
                    name: assistant.model?.name || 'gpt-4',
                    settings: assistant.model?.settings || {}
                },
                settings: assistant.settings || {},
                org_id: assistant.orgId,
                created_at: assistant.createdAt,
                updated_at: assistant.updatedAt
            }));
        },

        get: async (id: string): Promise<Assistant> => {
            const assistant = await this.request<VapiAssistant>(`/assistant/${id}`);
            return {
                id: assistant.id,
                name: assistant.name || '',
                description: assistant.description || '',
                language: assistant.language || 'en',
                model: {
                    name: assistant.model?.name || 'gpt-4',
                    settings: assistant.model?.settings || {}
                },
                settings: assistant.settings || {},
                org_id: assistant.orgId,
                created_at: assistant.createdAt,
                updated_at: assistant.updatedAt
            };
        },

        sync: async (): Promise<void> => {
            try {
                // Fetch assistants from VAPI
                const assistants = await this.assistants.list();
                console.log('Fetched assistants from VAPI:', assistants.length);
                
                // For each assistant, upsert into Supabase
                for (const assistant of assistants) {
                    console.log(`Syncing assistant: ${assistant.name} (${assistant.id})`);
                    const { error } = await supabaseAdmin
                        .from('assistants')
                        .upsert({
                            id: assistant.id,
                            name: assistant.name,
                            description: assistant.description,
                            language: assistant.language,
                            model: assistant.model,
                            settings: assistant.settings,
                            org_id: assistant.org_id,
                            created_at: assistant.created_at,
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'id'
                        });

                    if (error) {
                        console.error(`Error syncing assistant ${assistant.id}:`, error);
                    } else {
                        console.log(`Successfully synced assistant: ${assistant.name}`);
                    }
                }
            } catch (error) {
                console.error('Error syncing assistants:', error);
                throw error;
            }
        }
    };
}

export const vapiService = new VapiService(); 