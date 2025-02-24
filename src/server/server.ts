import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Validate environment variables are loaded
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'VAPI_PRIVATE_KEY',
    'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please ensure these variables are set in your .env file');
    process.exit(1);
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { VapiClient } from '@vapi-ai/server-sdk';
import { supabase, supabaseAdmin } from './lib/supabase';
import authRouter from './routes/auth';
import { authenticateToken, AuthenticatedRequest, checkAdminAccess } from './middleware/auth';
import {
    VapiCall,
    VapiCallResponse,
    VapiAssistantResponse,
    VapiAssistant,
    asVapiAssistant,
    asVapiCall,
    asVapiCallResponse
} from '../types/vapi';
import { createClient } from '@supabase/supabase-js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'development'
            ? 'http://localhost:8080'
            : 'your_production_url',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize VAPI client with environment variables
const vapi = new VapiClient({
    token: process.env.VAPI_PRIVATE_KEY || ''
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? ['http://localhost:8080']
        : 'your_production_url',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api', authenticateToken);

// WebSocket connection handling
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        // Create an admin client for token verification
        const adminClient = createClient(
            process.env.VITE_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_KEY || ''
        );

        const { data: { user }, error } = await adminClient.auth.getUser(token);
        if (error || !user) {
            console.error('Socket auth error:', error);
            return next(new Error('Authentication error'));
        }

        // Get additional user data from the users table
        const { data: userData, error: userError } = await adminClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            console.error('Socket user data error:', userError);
            return next(new Error('Authentication error'));
        }

        socket.data.user = {
            ...user,
            role: userData.role
        };
        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        return next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('Client connected');
    let updateInterval: NodeJS.Timeout;

    // Handle real-time assistant data streaming
    socket.on('subscribe_assistant', async (assistantId: string) => {
        try {
            // Initial data load
            const response = await vapi.calls.list({ assistantId });
            const calls = (response as unknown[]).map(asVapiCall);

            // Process initial call data
            const callStats: CallStats = processCallStats(calls);

            // Remove cost information for editors
            if (socket.data.user?.role === 'editor') {
                delete callStats.totalCost;
                if (callStats.calls) {
                    callStats.calls = callStats.calls.map(call => {
                        const { costs, ...callWithoutCosts } = call;
                        return callWithoutCosts;
                    });
                }
            }

            socket.emit('assistant_data', { calls, stats: callStats });

            // Set up real-time updates
            updateInterval = setInterval(async () => {
                try {
                    const newResponse = await vapi.calls.list({ assistantId });
                    const newCalls = (newResponse as unknown[]).map(asVapiCall);
                    const newCallStats: CallStats = processCallStats(newCalls);

                    // Remove cost information for editors
                    if (socket.data.user?.role === 'editor') {
                        delete newCallStats.totalCost;
                        if (newCallStats.calls) {
                            newCallStats.calls = newCallStats.calls.map(call => {
                                const { costs, ...callWithoutCosts } = call;
                                return callWithoutCosts;
                            });
                        }
                    }

                    socket.emit('assistant_data', { calls: newCalls, stats: newCallStats });
                } catch (error) {
                    console.error('Error fetching real-time data:', error);
                }
            }, 5000); // Update every 5 seconds

            // Clean up on disconnect or unsubscribe
            socket.on('unsubscribe_assistant', () => {
                if (updateInterval) {
                    clearInterval(updateInterval);
                }
            });

            socket.on('disconnect', () => {
                if (updateInterval) {
                    clearInterval(updateInterval);
                }
            });
        } catch (error) {
            console.error('Error setting up real-time updates:', error);
            socket.emit('error', 'Failed to set up real-time updates');
        }
    });
});

// Add interface for call stats
interface CallStats {
    totalCalls: number;
    incomingCalls: number;
    averageDuration: number;
    callsPerDay: { date: string; calls: number; }[];
    totalCost?: number;
    calls?: Array<{
        id: string;
        status: string;
        createdAt: string;
        duration?: number;
        costs?: {
            total: number;
            stt: number;
            llm: number;
            tts: number;
            vapi: number;
        };
    }>;
}

// Helper function to process call statistics
function processCallStats(calls: VapiCall[]): CallStats {
    const callsPerDay: { [key: string]: number } = {};
    let totalCalls = 0;
    let incomingCalls = 0;
    let totalDuration = 0;

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Initialize all dates in the last 30 days with 0 calls
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        callsPerDay[dateStr] = 0;
    }

    calls.forEach(call => {
        const callDate = new Date(call.createdAt);
        if (callDate >= thirtyDaysAgo) {
            totalCalls++;
            if (call.status !== 'error' && call.status !== 'failed') {
                incomingCalls++;
            }
            if (call.duration) {
                totalDuration += call.duration;
            }
            const date = callDate.toISOString().split('T')[0];
            callsPerDay[date] = (callsPerDay[date] || 0) + 1;
        }
    });

    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls / 1000 / 60) : 0;
    const callsPerDayArray = Object.entries(callsPerDay)
        .map(([date, calls]) => ({ date, calls }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalCalls,
        incomingCalls,
        averageDuration,
        callsPerDay: callsPerDayArray,
        calls: calls.map(call => ({
            id: call.id,
            status: call.status,
            createdAt: call.createdAt,
            duration: call.duration,
            costs: call.costs ? {
                total: call.costs.total || 0,
                stt: call.costs.stt || 0,
                llm: call.costs.llm || 0,
                tts: call.costs.tts || 0,
                vapi: call.costs.vapi || 0
            } : undefined
        }))
    };
}

// Add this function near the top with other helper functions
const getUserAssistants = async (userId: string): Promise<string[]> => {
    const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('assigned_assistants, default_assistant_id')
        .eq('id', userId)
        .single();

    if (error) throw error;
    
    if (userData.default_assistant_id) {
        return [userData.default_assistant_id];
    }
    
    return userData.assigned_assistants || [];
};

// Update the hasAssistantAccess function
const hasAssistantAccess = async (userId: string, assistantId: string) => {
    try {
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('role, assistant_access, assigned_assistants, default_assistant_id')
            .eq('id', userId)
            .single();

        if (!user) return false;

        // Owners and admins have access to all assistants
        if (user.role === 'owner' || user.role === 'admin') {
            return true;
        }

        // For editors and regular users, check assigned assistants
        if (user.assistant_access === 'all') {
            return true;
        }

        if (user.default_assistant_id === assistantId) {
            return true;
        }

        return user.assigned_assistants?.includes(assistantId) || false;
    } catch (error) {
        console.error('Error checking assistant access:', error);
        return false;
    }
};

// VAPI routes
app.get('/api/assistants', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Get user data to check role and assignments
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('role, assigned_assistants')
            .eq('id', req.user?.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw userError;
        }

        console.log('User data from database:', userData);

        // Fetch all assistants from VAPI
        console.log('Fetching assistants from VAPI...');
        const response = await vapi.assistants.list();
        console.log('Raw VAPI response:', response);

        const allAssistants = (response as unknown[]).map(asVapiAssistant);
        console.log('Mapped assistants:', allAssistants);

        // Filter assistants based on user role and assignments
        let assistants: VapiAssistantResponse[];
        if (userData.role === 'owner') {
            console.log('User is owner, returning all assistants');
            assistants = allAssistants;
        } else if (userData.assigned_assistants?.length) {
            console.log('Filtering assistants for admin/editor with assignments');
            assistants = allAssistants.filter(assistant => 
                userData.assigned_assistants?.includes(assistant.id)
            );
        } else {
            console.log('No assistants assigned to user');
            assistants = [];
        }

        console.log('Final assistants array:', assistants);
        res.json({ data: assistants });
    } catch (error) {
        console.error('Error fetching assistants:', error);
        res.status(500).json({ error: 'Failed to fetch assistants' });
    }
});

// Add this interface near the top with other interfaces
interface CallData {
    id: string;
    status: string;
    durationMs?: number;
    createdAt: string;
    costs?: {
        total: number;
        stt: number;
        llm: number;
        tts: number;
        vapi: number;
    };
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// Add the cache helper functions
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30000; // 30 seconds

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

// Update the analytics/calls endpoint
app.get('/api/assistants/:assistantId/analytics/calls', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { assistantId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const hasAccess = await hasAssistantAccess(userId, assistantId);
        if (!hasAccess) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

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

app.get('/api/assistants/:assistantId/analytics/transcripts', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const { assistantId } = req.params;
        const userId = req.user?.id;

        if (!userId || !(await hasAssistantAccess(userId, assistantId))) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const response = await vapi.calls.list({ assistantId });
        const calls = (response as unknown[]).map(asVapiCall);

        const transcripts = [];
        for (const call of calls) {
            try {
                const callResponse = await vapi.calls.get(call.id);
                const response = asVapiCallResponse(callResponse);
                const messages = response.messages || response.artifact?.messages || [];

                // Filter messages and skip the first one
                const filteredMessages = messages
                    .filter(msg => msg.role === 'user' || msg.role === 'bot' || msg.role === 'assistant')
                    .slice(1) // Skip the first message
                    .map(msg => ({
                        id: `${call.id}-${msg.time}`,
                        callId: call.id,
                        timestamp: new Date(msg.time).toISOString(),
                        content: msg.content || msg.message || '',
                        speaker: msg.role === 'user' ? 'user' : 'bot'
                    }));

                transcripts.push(...filteredMessages);
            } catch (error) {
                console.error(`Error fetching messages for call ${call.id}:`, error);
            }
        }

        res.json(transcripts);
    } catch (error) {
        console.error('Error fetching transcripts:', error);
        res.status(500).json({ error: 'Failed to fetch transcripts' });
    }
});

// Add interface for ticket stats
interface TicketStats {
    open: number;
    inProgress: number;
    resolved: number;
    unassigned: number;
    totalTickets: number;
    ticketsPerStatus: Array<{ status: string; count: number }>;
    averageDuration: number;
    totalCost?: number;
    calls: Array<{
        id: string;
        assistantId: string;
        status: string;
        createdAt: string;
        duration: number;
        summary: string;
        costs?: {
            total: number;
            stt: number;
            llm: number;
            tts: number;
            vapi: number;
        };
    }>;
}

app.get('/api/assistants/:assistantId/analytics/tickets', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const { assistantId } = req.params;
        const userId = req.user?.id;

        if (!userId || !(await hasAssistantAccess(userId, assistantId))) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const response = await vapi.calls.list({ assistantId });
        const calls = (response as unknown[]).map(asVapiCall);

        const statusCounts: { [key: string]: number } = {};
        let totalDuration = 0;

        const callDetails = await Promise.all(calls.map(async call => {
            const status = call.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (call.duration) {
                totalDuration += call.duration;
            }

            let summary = 'No summary available';
            try {
                const callResponse = await vapi.calls.get(call.id);
                const response = asVapiCallResponse(callResponse);
                summary = call.summary ||
                    call.analysis?.summary ||
                    response.artifact?.summary ||
                    response.artifact?.analysis?.summary ||
                    'No summary available';
            } catch (error) {
                console.error(`Error fetching summary for call ${call.id}:`, error);
            }

            // Base call data without costs
            const callData = {
                id: call.id,
                assistantId,
                status: call.status || 'unknown',
                createdAt: call.createdAt,
                duration: call.duration ? Math.round(call.duration / 1000) : 0,
                summary
            };

            // Only include costs for admin/owner
            if (req.user?.role === 'admin' || req.user?.role === 'owner') {
                return {
                    ...callData,
                    costs: {
                        total: call.costs?.total || 0,
                        stt: call.costs?.stt || 0,
                        llm: call.costs?.llm || 0,
                        tts: call.costs?.tts || 0,
                        vapi: call.costs?.vapi || 0
                    }
                };
            }

            return callData;
        }));

        const averageDuration = calls.length > 0 ? Math.round(totalDuration / calls.length / 1000) : 0;

        const ticketStats: TicketStats = {
            open: statusCounts['in_progress'] || 0,
            inProgress: (statusCounts['in_progress'] || 0) + (statusCounts['started'] || 0),
            resolved: (statusCounts['completed'] || 0) + (statusCounts['ended'] || 0),
            unassigned: (statusCounts['queued'] || 0) + (statusCounts['created'] || 0),
            totalTickets: calls.length,
            ticketsPerStatus: Object.entries(statusCounts).map(([status, count]) => ({
                status: status.replace('_', ' '),
                count
            })),
            averageDuration,
            calls: callDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        };

        // Remove cost-related fields for editors
        if (req.user?.role === 'editor') {
            delete ticketStats.totalCost;
            ticketStats.calls = ticketStats.calls.map(call => {
                const { costs, ...callWithoutCosts } = call;
                return callWithoutCosts;
            });
        }

        res.json(ticketStats);
    } catch (error) {
        console.error('Error fetching ticket analytics:', error);
        res.status(500).json({ error: 'Failed to fetch ticket analytics' });
    }
});

interface VapiCallRecordingResponse {
    recording_url?: string;
    recordingUrl?: string;
    artifact?: {
        recordingUrl?: string;
    };
    recording?: {
        url?: string;
    };
    status?: 'created' | 'queued' | 'in-progress' | 'completed' | string;
}

// Get call recording URL endpoint
app.get('/api/calls/:callId/recording', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        const { callId } = req.params;
        console.log('Fetching recording for call:', callId);

        const callResponse = await vapi.calls.get(callId);
        const callDetails = callResponse as unknown as VapiCallRecordingResponse;
        
        console.log('VAPI call details:', JSON.stringify(callDetails, null, 2));

        if (!callDetails) {
            res.status(404).json({ error: 'Call not found' });
            return;
        }

        const recordingUrl = 
            callDetails.recording_url || 
            callDetails.recordingUrl || 
            callDetails.artifact?.recordingUrl || 
            callDetails.recording?.url;

        if (!recordingUrl) {
            const status = callDetails.status;
            let errorMessage = 'Recording not available';

            if (!status || ['created', 'queued'].includes(status)) {
                errorMessage = 'Call has not started yet';
            } else if (status === 'in-progress') {
                errorMessage = 'Call is still in progress';
            } else if (status === 'ended' && !recordingUrl) {
                errorMessage = 'Recording not found for completed call';
            }

            console.log('No recording URL found. Call status:', status);
            res.status(404).json({ error: errorMessage });
            return;
        }

        res.json({ url: recordingUrl });
    } catch (error) {
        console.error('Error fetching call recording:', error);
        res.status(500).json({
            error: 'Failed to fetch call recording',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Admin user management routes
app.get('/api/admin/users', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        console.log('Fetching all users');
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select(`
                id,
                email,
                name,
                role,
                assistant_access,
                language,
                assigned_assistants,
                assigned_assistant_names,
                default_assistant_id,
                default_assistant_name,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        // Fetch all assistants once
        const response = await vapi.assistants.list();
        const assistants = (response as unknown[]).map(asVapiAssistant);
        console.log('Fetched assistants:', assistants);

        // Add assistant details to each user
        const usersWithAssistants = users.map(user => {
            // Get the default assistant details
            const defaultAssistant = user.default_assistant_id 
                ? assistants.find(a => a.id === user.default_assistant_id)
                : null;

            // Get details for all assigned assistants
            const assignedAssistantDetails = assistants.filter(assistant => 
                user.assigned_assistants?.includes(assistant.id)
            );

            return {
                ...user,
                defaultAssistantDetails: defaultAssistant || null,
                assignedAssistantDetails: assignedAssistantDetails || []
            };
        });
        
        console.log('Users with assistant details:', usersWithAssistants);
        res.json({ data: usersWithAssistants });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/admin/users', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        const { email, password, role, assistantAccess, assignedVapiIds } = req.body;

        // Create auth user first
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        console.log('Created auth user:', authData.user);

        // Fetch assistant names from VAPI
        const response = await vapi.assistants.list();
        const assistants = (response as unknown[]).map(asVapiAssistant);
        
        // Get assistant names for the assigned IDs
        const assignedAssistantNames = assignedVapiIds?.map((id: string) => {
            const assistant = assistants.find(a => a.id === id);
            return assistant ? assistant.name : id;
        }) || [];

        // For single access, use the first assistant as default
        const defaultAssistantId = assistantAccess === 'single' ? assignedVapiIds?.[0] : null;

        // Create user record with the auth user's ID
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .insert([{
                id: authData.user.id,
                email,
                role: role || 'viewer',
                assistant_access: assistantAccess || 'single',
                assigned_assistants: assignedAssistantNames,
                default_assistant_id: defaultAssistantId,
                language: 'en'
            }])
            .select()
            .single();

        if (userError) {
            console.error('Database error:', userError);
            throw userError;
        }

        console.log('Created user record:', userData);
        res.json({ data: userData });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/admin/users/:userId', authenticateToken, checkAdminAccess, async (req: Request<{ userId: string }>, res: Response) => {
    try {
        const { userId } = req.params;
        console.log('Updating user with ID:', userId);

        const { role, assistantAccess, assignedVapiIds, language } = req.body as {
            role: string;
            assistantAccess: string;
            assignedVapiIds: string[];
            language: string;
        };

        console.log('Update payload:', { role, assistantAccess, assignedVapiIds, language });

        // Validate assistant access and assigned IDs
        if (assistantAccess === 'single' && assignedVapiIds?.length > 1) {
            console.log('Validation failed: Multiple assistants assigned in single mode');
            res.status(400).json({ 
                error: 'Single assistant access can only have one assigned assistant' 
            });
            return;
        }

        // Fetch assistant names from VAPI
        const response = await vapi.assistants.list();
        const assistants = (response as unknown[]).map(asVapiAssistant);
        console.log('Fetched assistants:', assistants);
        
        // First ensure the assistants exist in our database
        interface RawAssistant {
            id: string;
            name: string;
            model?: string;
            settings?: {
                temperature?: number;
                maxTokens?: number;
                systemPrompt?: string;
            };
        }

        for (const assistant of assistants) {
            const rawAssistant = assistant as RawAssistant;
            const { error: upsertError } = await supabaseAdmin
                .from('assistants')
                .upsert({
                    id: assistant.id,
                    name: assistant.name,
                    model: rawAssistant.model || 'gpt-4',
                    temperature: rawAssistant.settings?.temperature || 0.7,
                    max_tokens: rawAssistant.settings?.maxTokens || 2000,
                    system_prompt: rawAssistant.settings?.systemPrompt || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            if (upsertError) {
                console.error('Error upserting assistant:', upsertError);
                throw upsertError;
            }
        }

        // For single access, use the first assistant as default
        const defaultAssistantId = assistantAccess === 'single' ? assignedVapiIds[0] : null;
        console.log('Default assistant ID:', defaultAssistantId);

        // Update user with verified assistant IDs
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .update({
                role,
                assistant_access: assistantAccess,
                assigned_assistants: assignedVapiIds,
                default_assistant_id: defaultAssistantId,
                language
            })
            .eq('id', userId)
            .select()
            .single();

        if (userError) {
            console.error('Error updating user in database:', userError);
            throw userError;
        }

        console.log('Successfully updated user:', userData);
        res.json({ data: userData });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/admin/users/:userId', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        const { userId } = req.params;

        // First delete user from our users table
        const { error: userError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            console.error('Error deleting user from database:', userError);
            throw userError;
        }

        // Then delete user from auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
            console.error('Error deleting user from auth:', authError);
            throw authError;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Health check route
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start the server
const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});