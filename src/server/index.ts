import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { VapiClient } from '@vapi-ai/server-sdk';
import authRouter from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

// Define interfaces for type safety
interface CallData {
    id: string;
    status: string;
    durationMs?: number;
    createdAt: string;
    summary?: string;
    analysis?: {
        summary?: string;
        successEvaluation?: string;
    };
    artifact?: {
        summary?: string;
        analysis?: {
            summary?: string;
        };
    };
    costs?: {
        total?: number;
        stt?: number;
        llm?: number;
        tts?: number;
        vapi?: number;
    };
}

interface MessageData {
    role: string;
    time: number;
    message?: string;
    secondsFromStart: number;
}

interface Assistant {
    id: string;
    model?: {
        messages?: { content: string }[];
    };
}

interface CallResponse {
    artifact: {
        messages: MessageData[];
    };
    messages?: MessageData[];
}

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize VAPI client with configuration
const vapi = new VapiClient({
    token: process.env.VAPI_PRIVATE_KEY || ''
});

// Cache for storing API responses
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30000; // 30 seconds

// Utility function to get or set cached data
const getCachedData = async <T>(
    key: string,
    fetchFn: () => Promise<T>
): Promise<T> => {
    const now = Date.now();
    const cached = cache.get(key) as CacheEntry<T> | undefined;

    if (cached && now - cached.timestamp < CACHE_TTL) {
        console.log(`Using cached data for ${key}`);
        return cached.data;
    }

    console.log(`Fetching fresh data for ${key}`);
    const data = await fetchFn();
    cache.set(key, { data, timestamp: now });
    return data;
};

// Retry utility function with timeout
const retryWithTimeout = async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    timeout = 10000
): Promise<T> => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), timeout);
            });

            const resultPromise = fn();
            const result = await Promise.race([resultPromise, timeoutPromise]);
            return result as T;
        } catch (error) {
            lastError = error as Error;
            console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    }

    throw lastError || new Error('All retries failed');
};

// Auth routes (unprotected)
app.use('/api/auth', authRouter);

// All routes after this middleware will require authentication
app.use('/api', authenticateToken);

// Protected routes
app.get('/api/assistants', async (_req: Request, res: Response) => {
    try {
        const assistants = await vapi.assistants.list() as Assistant[];
        // Delete the content of the first message for each assistant if it exists
        assistants.forEach(assistant => {
            if (assistant?.model?.messages?.[0]) {
                assistant.model.messages[0].content = '';
            }
        });
        res.json({ data: assistants });
    } catch (error) {
        console.error('Error fetching assistants:', error);
        res.status(500).json({ error: 'Failed to fetch assistants' });
    }
});

// Call analytics endpoint
app.get('/api/assistants/:assistantId/analytics/calls', async (req: Request, res: Response) => {
    try {
        const { assistantId } = req.params;
        const cacheKey = `calls:${assistantId}`;

        const data = await getCachedData(cacheKey, async () => {
            console.log('Fetching calls for assistant:', assistantId);
            const calls = await retryWithTimeout(async () =>
                vapi.calls.list({
                    assistantId
                }) as Promise<CallData[]>
            );

            // Process calls data
            const callsPerDay: { [key: string]: number } = {};
            let totalCalls = 0;
            let incomingCalls = 0;
            let totalDuration = 0;

            calls.forEach(call => {
                totalCalls++;
                if (call.status === 'completed') {
                    incomingCalls++;
                }
                if (call.durationMs) {
                    totalDuration += call.durationMs;
                }
                const date = new Date(call.createdAt).toISOString().split('T')[0];
                callsPerDay[date] = (callsPerDay[date] || 0) + 1;
            });

            const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls / 1000 / 60) : 0;
            const callsPerDayArray = Object.entries(callsPerDay)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            return {
                totalCalls,
                incomingCalls,
                averageDuration,
                callsPerDay: callsPerDayArray
            };
        });

        res.json(data);
    } catch (error) {
        console.error('Error fetching call analytics:', error);
        res.status(500).json({ error: 'Failed to fetch call analytics' });
    }
});

// Transcripts endpoint
app.get('/api/assistants/:assistantId/analytics/transcripts', async (req: Request, res: Response) => {
    try {
        const { assistantId } = req.params;
        const cacheKey = `transcripts:${assistantId}`;

        const transcripts = await getCachedData(cacheKey, async () => {
            console.log('Fetching transcripts for assistant:', assistantId);
            const calls = await retryWithTimeout(async () =>
                vapi.calls.list({
                    assistantId
                }) as Promise<CallData[]>
            );

            const results = [];
            for (const call of calls) {
                try {
                    const response = await retryWithTimeout(async () => {
                        const result = await vapi.calls.get(call.id);
                        return result as CallResponse;
                    });

                    if (!response || typeof response !== 'object') {
                        console.warn(`Invalid response format for call ${call.id}`);
                        continue;
                    }

                    const messages = response.messages || response.artifact?.messages || [];
                    if (!Array.isArray(messages)) {
                        console.warn(`Invalid messages format for call ${call.id}`);
                        continue;
                    }

                    const filteredMessages = messages
                        .filter((msg): msg is MessageData => {
                            if (!msg || typeof msg !== 'object') {
                                return false;
                            }
                            return msg.role === 'user' || msg.role === 'bot' || msg.role === 'assistant';
                        })
                        .map(msg => ({
                            id: `${call.id}-${msg.time}`,
                            callId: call.id,
                            timestamp: new Date(msg.time).toISOString(),
                            content: msg.message || '',
                            speaker: msg.role === 'user' ? 'user' : 'bot'
                        }));

                    results.push(...filteredMessages);
                } catch (error) {
                    console.error(`Error fetching messages for call ${call.id}:`, error);
                    continue;
                }
            }

            results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            return results;
        });

        res.json(transcripts);
    } catch (error) {
        console.error('Error fetching transcripts:', error);
        res.status(500).json({
            error: 'Failed to fetch transcripts',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Ticket stats endpoint
app.get('/api/assistants/:assistantId/analytics/tickets', async (req: Request, res: Response) => {
    try {
        const { assistantId } = req.params;
        const cacheKey = `tickets:${assistantId}`;

        const ticketStats = await getCachedData(cacheKey, async () => {
            console.log('Fetching ticket stats for assistant:', assistantId);
            const calls = await retryWithTimeout(async () =>
                vapi.calls.list({
                    assistantId
                }) as Promise<CallData[]>
            );

            const statusCounts = calls.reduce((acc: Record<string, number>, call) => {
                const status = call.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const callDetails = calls.map(call => {
                const summary = call.summary ||
                    call.analysis?.summary ||
                    call.artifact?.summary ||
                    call.artifact?.analysis?.summary ||
                    'No summary available';

                return {
                    id: call.id,
                    status: call.status || 'unknown',
                    createdAt: call.createdAt,
                    duration: call.durationMs ? Math.round(call.durationMs / 1000) : 0,
                    summary,
                    costs: {
                        total: call.costs?.total || 0,
                        stt: call.costs?.stt || 0,
                        llm: call.costs?.llm || 0,
                        tts: call.costs?.tts || 0,
                        vapi: call.costs?.vapi || 0
                    }
                };
            });

            return {
                open: statusCounts['in_progress'] || 0,
                inProgress: statusCounts['in_progress'] || 0,
                resolved: statusCounts['ended'] || 0,
                unassigned: statusCounts['queued'] || 0,
                totalTickets: calls.length,
                ticketsPerStatus: Object.entries(statusCounts).map(([status, count]) => ({
                    status: status.replace('_', ' '),
                    count
                })),
                totalCost: calls.reduce((acc, call) => acc + (call.costs?.total || 0), 0),
                averageDuration: calls.reduce((acc, call) => acc + (call.durationMs || 0), 0) / calls.length,
                calls: callDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            };
        });

        res.json(ticketStats);
    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        res.status(500).json({ error: 'Failed to fetch ticket stats' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 