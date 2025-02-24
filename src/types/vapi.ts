import type { VapiClient } from '@vapi-ai/server-sdk';

type VapiSDKClient = typeof VapiClient.prototype;
type VapiSDKAssistant = Awaited<ReturnType<VapiSDKClient['assistants']['list']>>[number];
type VapiSDKCall = Awaited<ReturnType<VapiSDKClient['calls']['list']>>[number];
type VapiSDKCallResponse = Awaited<ReturnType<VapiSDKClient['calls']['get']>>;

export interface VapiAssistantResponse {
    id: string;
    name: string;
    model?: {
        name?: string;
        settings?: {
            temperature?: number;
            maxTokens?: number;
            systemPrompt?: string;
        };
        messages?: Array<{
            content: string;
        }>;
    };
    settings?: {
        voice_id?: string;
        initial_message?: string;
        temperature?: number;
        maxTokens?: number;
    };
    artifactPlan?: {
        recordingEnabled?: boolean;
        transcriptEnabled?: boolean;
        summaryEnabled?: boolean;
        analysisEnabled?: boolean;
    };
}

export interface VapiCall {
    id: string;
    status: string;
    duration?: number;
    createdAt: string;
    summary?: string;
    analysis?: {
        summary?: string;
        successEvaluation?: string;
    };
    costs?: {
        total?: number;
        stt?: number;
        llm?: number;
        tts?: number;
        vapi?: number;
    };
}

export interface VapiMessage {
    role: 'user' | 'bot' | 'assistant';
    time: number;
    message?: string;
    content?: string;
    secondsFromStart?: number;
}

export interface VapiCallResponse {
    messages?: VapiMessage[];
    artifact?: {
        messages?: VapiMessage[];
        summary?: string;
        analysis?: {
            summary?: string;
        };
        recording_url?: string;
    };
    summary?: string;
    analysis?: {
        summary?: string;
    };
}

// Type assertion functions
export function assertVapiAssistant(data: unknown): asserts data is VapiAssistantResponse {
    const assistant = data as VapiAssistantResponse;
    if (!assistant?.id || !assistant?.name) {
        throw new Error('Invalid assistant data');
    }
}

export function assertVapiCall(data: unknown): asserts data is VapiCall {
    const call = data as VapiCall;
    if (!call?.id || !call?.status || !call?.createdAt) {
        throw new Error('Invalid call data');
    }
}

export function assertVapiCallResponse(data: unknown): asserts data is VapiCallResponse {
    const response = data as VapiCallResponse;
    // Allow empty responses - they might be in progress or not started yet
    if (typeof response !== 'object' || response === null) {
        throw new Error('Invalid call response data: response must be an object');
    }
    // Don't require messages - they might not be available yet
    return;
}

// Helper functions
export function asVapiAssistant(data: unknown): VapiAssistantResponse {
    assertVapiAssistant(data);
    return data;
}

export function asVapiCall(data: unknown): VapiCall {
    assertVapiCall(data);
    return data;
}

export function asVapiCallResponse(data: unknown): VapiCallResponse {
    assertVapiCallResponse(data);
    return data;
}

// Update the VapiAssistant type to include all necessary fields
export type VapiAssistant = VapiSDKAssistant & VapiAssistantResponse & {
    language: string;
    model?: {
        name?: string;
        settings?: {
            temperature?: number;
            maxTokens?: number;
            systemPrompt?: string;
        };
        messages?: Array<{
            content: string;
        }>;
    };
    stats?: {
        totalCalls: number;
        totalMessages: number;
        averageDuration: number;
        successRate: number;
    };
    orgId?: string;
    createdAt: string;
    updatedAt: string;
};

export type VapiCallType = VapiSDKCall & VapiCall;
export type VapiCallResponseType = VapiSDKCallResponse & VapiCallResponse; 