export interface Assistant {
    id: string;
    name: string;
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
    org_id?: string;
    created_at?: string;
    updated_at?: string;
} 