import { Manager } from 'socket.io-client';
import { supabase } from '../lib/supabase-browser';
import { VapiCall } from '../types/vapi';

interface CallStats {
    totalCalls: number;
    incomingCalls: number;
    averageDuration: number;
    callsPerDay: { date: string; calls: number }[];
}

export interface AssistantData {
    calls: VapiCall[];
    stats: CallStats;
}

type EventCallback<T> = (data: T) => void;
type EventMap = {
    'assistant_data': AssistantData;
    'error': string;
};

interface SocketOptions {
    auth: {
        token?: string;
    };
    transports: string[];
    timeout: number;
}

class SocketService {
    private socket: ReturnType<typeof Manager.prototype.socket> | null = null;
    private listeners: Map<keyof EventMap, Set<EventCallback<EventMap[keyof EventMap]>>> = new Map();
    private serverUrl: string;

    constructor(serverUrl: string) {
        this.serverUrl = serverUrl;
    }

    async connect() {
        if (this.socket) return;

        try {
            // Get the current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error getting session:', error);
                return;
            }

            if (!session?.access_token) {
                console.error('No valid session found');
                return;
            }

            const options: SocketOptions = {
                auth: {
                    token: session.access_token
                },
                transports: ['websocket', 'polling'],
                timeout: 10000
            };

            const manager = new Manager(import.meta.env.DEV 
                ? 'http://localhost:3001' 
                : import.meta.env.VITE_API_URL, 
                options
            );

            this.socket = manager.socket('/');

            this.socket.on('connect_error', (error: Error) => {
                console.error('Connection error:', error.message);
            });

            this.socket.on('error', (error: string) => {
                console.error('Socket error:', error);
            });

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
            });

            // Set up listeners for assistant data
            this.socket.on('assistant_data', (data: AssistantData) => {
                console.log('Received assistant data:', data);
                this.notifyListeners('assistant_data', data);
            });
        } catch (error) {
            console.error('Socket connection error:', error);
        }
    }

    disconnect() {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = null;
    }

    subscribeToAssistant(assistantId: string) {
        if (!this.socket) {
            this.connect();
        }
        this.socket?.emit('subscribe_assistant', assistantId);
    }

    unsubscribeFromAssistant(assistantId: string) {
        this.socket?.emit('unsubscribe_assistant', assistantId);
    }

    addListener<K extends keyof EventMap>(
        event: K,
        callback: EventCallback<EventMap[K]>
    ) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.add(callback as EventCallback<EventMap[keyof EventMap]>);
        }
    }

    removeListener<K extends keyof EventMap>(
        event: K,
        callback: EventCallback<EventMap[K]>
    ) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.delete(callback as EventCallback<EventMap[keyof EventMap]>);
        }
    }

    private notifyListeners<K extends keyof EventMap>(
        event: K,
        data: EventMap[K]
    ) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
}

export const socketService = new SocketService(import.meta.env.VITE_API_URL || 'http://localhost:3001');
export default socketService; 