import { VapiAssistant } from '../types/user';
import { AssistantSettings } from '../lib/supabase';
import { supabase } from '../lib/supabase-browser';

const API_BASE_URL = 'http://localhost:3001/api';
const VAPI_BASE_URL = 'https://api.vapi.ai';

declare global {
  interface Window {
    vapiService: VapiService;
  }
}

// Mock data for development
export const MOCK_ASSISTANT: VapiAssistant = {
  id: '672ab50d-5c05-46dd-975b-5c4afb742244',
  name: 'Default Assistant',
  language: 'en',
  settings: {
    voice_id: 'en-US-Studio-M',
    initial_message: 'Hello! How can I help you today?'
  },
};

export interface CallStats {
  totalCalls: number;
  incomingCalls: number;
  averageDuration: number;
  callsPerDay: { date: string; calls: number }[];
}

export interface Transcript {
  id: string;
  callId: string;
  timestamp: string;
  content: string;
  speaker: 'user' | 'bot';
  messages: Array<{
    role: 'assistant' | 'user' | 'system';
    content: string;
    timestamp: string;
  }>;
  recordingUrl?: string;
}

interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  unassigned: number;
  totalTickets: number;
  ticketsPerStatus: { status: string; count: number }[];
  averageDuration: number;
  totalCost: number;
  calls: Array<{
    id: string;
    assistantId: string;
    status: string;
    endedReason?: string;
    createdAt: string;
    duration: number;
    summary: string;
    costs: {
      total: number;
      stt: number;
      llm: number;
      tts: number;
      vapi: number;
    };
  }>;
}

interface RawTranscript {
  id?: string;
  callId?: string;
  timestamp?: string;
  content?: string;
  speaker?: 'user' | 'bot';
  messages?: Array<{
    role: 'assistant' | 'user' | 'system';
    content: string;
    timestamp: string;
  }>;
  recordingUrl?: string;
}

// Add interface for phone number data
export interface PhoneNumber {
  id: string;
  number: string;
  assistantId: string;
  status: string;
  createdAt: string;
}

// Add interface for user data
interface UserAssistantData {
    assigned_assistants: string[];
    assigned_assistant_names: string[];
    default_assistant_id: string | null;
    default_assistant_name: string | null;
}

// Raw assistant data type from API
interface RawAssistant {
  id: string;
  name?: string;
  language?: string;
  settings?: {
    voice_id?: string;
    initial_message?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    model?: string;
  };
}

interface VapiPhoneNumberRequest {
    number: string;
    assistant_id: string;
    provider: 'twilio';  // Only allow Twilio
}

interface VapiPhoneNumberResponse {
    id: string;
    number: string;
    assistant_id: string;
    status: string;
    created_at: string;
    provider: string;
}

class VapiService {
  private baseUrl: string;
  private vapiUrl: string;
  private headers: Headers;
  private isDevelopment: boolean;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.vapiUrl = VAPI_BASE_URL;
    this.headers = new Headers({
      'Content-Type': 'application/json'
    });
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.apiKey = import.meta.env.VITE_VAPI_PRIVATE_KEY;
  }

  private async getAuthHeaders(): Promise<Headers> {
    const headers = new Headers(this.headers);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      console.log('Got session token:', session.access_token.slice(0, 10) + '...');
      headers.set('Authorization', `Bearer ${session.access_token}`);
    } else {
      console.warn('No session token available');
    }
    return headers;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing API connection...');
      console.log('Base URL:', this.baseUrl);

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/assistants`, {
        method: 'GET',
        headers
      });

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${text}`);
      }

      return { success: true, message: 'API connection successful.' };
    } catch (error) {
      console.error('API connection test failed:', error);
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    try {
      console.log('Fetching assistant with ID:', assistantId);
      const response = await fetch(`${this.baseUrl}/assistants/${assistantId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });
      return this.handleResponse<VapiAssistant>(response);
    } catch (error) {
      console.error('Error fetching assistant:', error);
      if (this.isDevelopment) {
        console.warn('Using mock data for assistant.');
        return MOCK_ASSISTANT;
      }
      throw error;
    }
  }

  async getAssistants(): Promise<{ data: VapiAssistant[] }> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Fetching assistants with headers:', Object.fromEntries(headers.entries()));
      
      const response = await fetch(`${this.baseUrl}/assistants`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response from assistants endpoint:', {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${text}`);
      }

      const responseData = await response.json();
      console.log('Raw assistants data:', responseData);

      // Ensure the response data matches the VapiAssistant type
      const assistants = responseData.data.map((assistant: RawAssistant): VapiAssistant => ({
        id: assistant.id,
        name: assistant.name || 'Unnamed Assistant',
        language: assistant.language || 'en',
        settings: {
          voice_id: assistant.settings?.voice_id,
          initial_message: assistant.settings?.initial_message,
          temperature: assistant.settings?.temperature,
          maxTokens: assistant.settings?.maxTokens,
          systemPrompt: assistant.settings?.systemPrompt,
          model: assistant.settings?.model
        }
      }));

      console.log('Processed assistants:', assistants);
      return { data: assistants };
    } catch (error) {
      console.error('Error fetching assistants:', error);
      if (this.isDevelopment) {
        console.warn('Falling back to mock assistant...');
        return { data: [MOCK_ASSISTANT] };
      }
      throw error;
    }
  }

  async createAssistant(settings: AssistantSettings): Promise<VapiAssistant> {
    try {
      const response = await fetch(`${this.baseUrl}/assistants`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      return this.handleResponse<VapiAssistant>(response);
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error;
    }
  }

  async updateAssistant(assistantId: string, settings: Partial<AssistantSettings>): Promise<VapiAssistant> {
    try {
      const response = await fetch(`${this.baseUrl}/assistants/${assistantId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      return this.handleResponse<VapiAssistant>(response);
    } catch (error) {
      console.error('Error updating assistant:', error);
      throw error;
    }
  }

  async deleteAssistant(assistantId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/assistants/${assistantId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });
      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      console.error('Error deleting assistant:', error);
      throw error;
    }
  }

  async getCallStats(assistantId: string): Promise<CallStats> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/assistants/${assistantId}/analytics/calls`, {
      headers
    });
    if (!response.ok) {
      throw new Error('Failed to fetch call stats');
    }
    return response.json();
  }

  async getTranscripts(assistantId: string): Promise<Transcript[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/assistants/${assistantId}/analytics/transcripts?include_messages=true`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      const data = await response.json();
      return data.map((transcript: RawTranscript) => ({
        id: transcript.id || '',
        callId: transcript.callId || '',
        timestamp: transcript.timestamp || new Date().toISOString(),
        content: transcript.content || '',
        speaker: transcript.speaker || 'user',
        messages: transcript.messages?.map(msg => ({
          role: msg.role || 'user',
          content: msg.content || '',
          timestamp: msg.timestamp || new Date().toISOString()
        })) || [],
        recordingUrl: transcript.recordingUrl
      }));
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      if (this.isDevelopment) {
        return [{
          id: '1',
          callId: '1',
          timestamp: new Date().toISOString(),
          content: 'Mock transcript content',
          speaker: 'user',
          messages: [
            {
              role: 'user',
              content: 'Hello, how can I help you?',
              timestamp: new Date().toISOString()
            },
            {
              role: 'assistant',
              content: 'Hi! I have a question about my reservation.',
              timestamp: new Date().toISOString()
            }
          ],
          recordingUrl: 'https://example.com/recording.mp3'
        }];
      }
      throw error;
    }
  }

  async getTicketStats(assistantId: string): Promise<TicketStats> {
    try {
      console.log('Making request to:', `${this.baseUrl}/assistants/${assistantId}/analytics/tickets`);
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/assistants/${assistantId}/analytics/tickets`, {
        headers
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ticket stats: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error in getTicketStats:', error);
      if (this.isDevelopment) {
        console.log('Using mock data for ticket stats');
        return {
          open: 5,
          inProgress: 3,
          resolved: 12,
          unassigned: 2,
          totalTickets: 22,
          ticketsPerStatus: [
            { status: 'open', count: 5 },
            { status: 'in progress', count: 3 },
            { status: 'resolved', count: 12 },
            { status: 'unassigned', count: 2 }
          ],
          averageDuration: 180,
          totalCost: 25.50,
          calls: []
        };
      }
      throw error;
    }
  }

  async getCallRecording(callId: string): Promise<string> {
    try {
      console.log('Fetching recording for call:', callId);
      
      // Get the call details
      const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_VAPI_PRIVATE_KEY}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('VAPI Error response:', errorData);
        throw new Error(errorData.error || `Failed to fetch call details: ${response.status}`);
      }

      const data = await response.json();
      console.log('Call details response:', JSON.stringify(data, null, 2));

      // Check if call is completed
      if (!data.status || !['ended', 'completed'].includes(data.status)) {
        throw new Error(data.status === 'in-progress' ? 'Call is still in progress' : 'Call has not started yet');
      }

      // Look for recordingUrl in the response
      const recordingUrl = data.recordingUrl || data.recording_url;

      if (!recordingUrl) {
        console.log('No recording URL found. This might be because recording is not enabled in the assistant artifactPlan.');
        console.log('Full response:', JSON.stringify(data, null, 2));
        throw new Error('Recording not available. Please ensure recording is enabled in the assistant settings (artifactPlan.recordingEnabled).');
      }

      console.log('Found recording URL:', recordingUrl);
      return recordingUrl;
    } catch (error) {
      console.error('Error fetching call recording:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch call recording');
    }
  }

  async getPhoneNumbers(): Promise<PhoneNumber[]> {
    try {
      const response = await fetch(`${this.vapiUrl}/phone-number`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch phone numbers: ${errorText}`);
      }

      const data = await response.json();
      // Ensure data is an array
      const phoneNumbers = Array.isArray(data) ? data : [data];
      return phoneNumbers.map((item: VapiPhoneNumberResponse) => ({
        id: item.id,
        number: item.number,
        assistantId: item.assistant_id,
        status: item.status,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      if (this.isDevelopment) {
        console.warn('Using mock data for phone numbers');
        return [{
          id: '1',
          number: '+1234567890',
          assistantId: MOCK_ASSISTANT.id,
          status: 'active',
          createdAt: new Date().toISOString()
        }];
      }
      throw new Error('Error fetching phone numbers: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async createPhoneNumber(number: string, assistantId: string): Promise<PhoneNumber> {
    try {
        const requestData: VapiPhoneNumberRequest = {
            number,
            assistant_id: assistantId,
            provider: 'twilio'  // Always use Twilio
        };

        console.log('Creating phone number with data:', requestData);

        const response = await fetch(`${this.vapiUrl}/phone-number`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Failed to create phone number: ${errorText}`);
        }

        const data: VapiPhoneNumberResponse = await response.json();
        return {
            id: data.id,
            number: data.number,
            assistantId: data.assistant_id,
            status: data.status,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('Error creating phone number:', error);
        throw new Error('Error creating phone number: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async updatePhoneNumber(id: string, number: string, assistantId?: string): Promise<PhoneNumber> {
    try {
      const updateData: Partial<VapiPhoneNumberRequest> = {};
      if (number) updateData.number = number;
      if (assistantId) updateData.assistant_id = assistantId;

      const response = await fetch(`${this.vapiUrl}/phone-number/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to update phone number: ${errorText}`);
      }

      const data: VapiPhoneNumberResponse = await response.json();
      return {
        id: data.id,
        number: data.number,
        assistantId: data.assistant_id,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error updating phone number:', error);
      throw new Error('Error updating phone number: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async deletePhoneNumber(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.vapiUrl}/phone-number/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to delete phone number: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
      throw new Error('Error deleting phone number: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async getCallDetails(callId: string) {
    try {
      console.log('Fetching call details for:', callId);
      const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_VAPI_PRIVATE_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch call details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Call details response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }
}

const vapiService = new VapiService();

// Expose service for testing in development
if (process.env.NODE_ENV === 'development') {
  window.vapiService = vapiService;
}

export default vapiService;

export async function assignAssistant(userId: string, assistantId: string, assistantName: string) {
    try {
        const { data: currentUser } = await supabase
            .from('users')
            .select('assigned_assistants, assigned_assistant_names')
            .eq('id', userId)
            .single() as { data: UserAssistantData | null };

        const newAssistants = [...(currentUser?.assigned_assistants || []), assistantId];
        const newAssistantNames = [...(currentUser?.assigned_assistant_names || []), assistantName];

        const { data, error } = await supabase
            .from('users')
            .update({
                assigned_assistants: newAssistants,
                assigned_assistant_names: newAssistantNames
            })
            .eq('id', userId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error assigning assistant:', error);
        return { data: null, error };
    }
}

export async function unassignAssistant(userId: string, assistantId: string, assistantName: string) {
    try {
        const { data: currentUser } = await supabase
            .from('users')
            .select('assigned_assistants, assigned_assistant_names')
            .eq('id', userId)
            .single() as { data: UserAssistantData | null };

        const newAssistants = (currentUser?.assigned_assistants || []).filter((id: string) => id !== assistantId);
        const newAssistantNames = (currentUser?.assigned_assistant_names || []).filter((name: string) => name !== assistantName);

        const { data, error } = await supabase
            .from('users')
            .update({
                assigned_assistants: newAssistants,
                assigned_assistant_names: newAssistantNames
            })
            .eq('id', userId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error unassigning assistant:', error);
        return { data: null, error };
    }
}

export async function setDefaultAssistant(userId: string, assistantId: string, assistantName: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                default_assistant_id: assistantId,
                default_assistant_name: assistantName
            })
            .eq('id', userId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error setting default assistant:', error);
        return { data: null, error };
    }
}
