import express, { Request, Response, Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../../types/supabase';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, AuthenticatedRequest, checkAdminAccess } from '../middleware/auth';
import { VapiClient } from '@vapi-ai/server-sdk';
import { VapiAssistant, asVapiAssistant } from '../../types/vapi';
import { VAPI_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../../lib/env';
import { UserRole } from '../../types/user';

const router = Router();

// Initialize VAPI client
const vapi = new VapiClient({
    token: VAPI_PRIVATE_KEY
});

interface SignUpBody {
    email: string;
    password: string;
    name?: string;
    questions?: {
        // Property Information
        propertyName: string;
        location: string;
        // Services & Amenities
        breakfastService: string;
        lunchService: string;
        dinnerService: string;
        poolHours: string;
        spaServices: string;
        // Additional Facilities
        checkoutProcedures: string;
        ironingFacilities: string;
        iceMachineLocation: string;
        kidsClubServices: string;
        synagogueServices: string;
        gymFacilities: string;
        businessLounge: string;
        // Special Requirements
        accessibilityFeatures: string;
        uniqueAmenities: string;
        // Contact Information
        contactPerson: string;
        contactEmail: string;
        contactPhone: string;
    };
}

interface LoginBody {
    email: string;
    password: string;
}

type AuthResponse = {
    user: Database['public']['Tables']['users']['Row'] | null;
    session: unknown;
} | {
    user: null;
    session: null;
    error: string;
}

interface UserRequestBody {
    access_token: string;
}

interface UserResponse {
    data?: Database['public']['Tables']['users']['Row'];
    error?: string;
}

const signUpHandler: express.RequestHandler<Record<string, never>, AuthResponse, SignUpBody> = async (req, res) => {
    try {
        const { email, password, name, questions } = req.body;
        console.log('Signup request received:', { email, name });

        // Create auth user with admin client
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: 'user'  // Always set to 'user' for new signups
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            res.status(400).json({ user: null, session: null, error: authError.message });
            return;
        }

        if (!authData.user) {
            console.error('No user data returned');
            res.status(500).json({ user: null, session: null, error: 'Failed to create user' });
            return;
        }

        // First check if user already exists
        console.log('Checking if user exists...');
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing user:', checkError);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            res.status(500).json({ user: null, session: null, error: 'Failed to check existing user' });
            return;
        }

        let userData;
        if (existingUser) {
            // Update existing user
            console.log('Updating existing user record...');
            const { data: updatedUser, error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    email: authData.user.email,
                    name: name || null,
                    questions: questions || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', authData.user.id)
                .select('*')
                .single();

            if (updateError) {
                console.error('Error updating user record:', updateError);
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                res.status(500).json({ user: null, session: null, error: 'Failed to update user record' });
                return;
            }

            userData = updatedUser;
        } else {
            // Create new user record
            console.log('Creating new user record...');
            const { data: newUser, error: createError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    name: name || null,
                    role: 'user',
                    assistant_access: 'single',
                    language: 'en',
                    assigned_assistants: [],
                    default_assistant_id: null,
                    questions: questions || null
                })
                .select('*')
                .single();

            if (createError) {
                console.error('Error creating user record:', createError);
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                res.status(500).json({ user: null, session: null, error: 'Failed to create user record' });
                return;
            }

            userData = newUser;
        }

        if (!userData) {
            console.error('No user data returned after creation/update');
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            res.status(500).json({ user: null, session: null, error: 'Failed to create/update user record' });
            return;
        }

        console.log('User operation successful:', userData);
        res.json({ user: userData, session: null });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ user: null, session: null, error: 'Internal server error during signup' });
    }
};

// Sign in
const loginHandler: express.RequestHandler<Record<string, never>, AuthResponse, LoginBody> = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            res.status(400).json({ user: null, session: null, error: 'Email and password are required' });
            return;
        }

        console.log('Attempting login with:', { email });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error);
            res.status(400).json({ user: null, session: null, error: error.message });
            return;
        }

        if (!data.user) {
            console.error('No user data returned from login');
            res.status(400).json({ user: null, session: null, error: 'Login failed' });
            return;
        }

        // Create a new session
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: data.session?.access_token || '',
            refresh_token: data.session?.refresh_token || ''
        });

        if (sessionError) {
            console.error('Session error:', sessionError);
            res.status(400).json({ user: null, session: null, error: sessionError.message });
            return;
        }

        // Get user data from the users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError) {
            console.error('User data fetch error:', userError);
            res.status(400).json({ user: null, session: null, error: userError.message });
            return;
        }

        console.log('Login successful for user:', userData);
        res.json({ user: userData, session: data.session });
    } catch (error) {
        console.error('Unexpected error during login:', error);
        res.status(500).json({ user: null, session: null, error: 'An unexpected error occurred' });
    }
};

// Sign out
const logoutHandler: express.RequestHandler<object, AuthResponse> = async (_, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        res.status(400).json({ user: null, session: null, error: error.message });
        return;
    }

    res.json({ user: null, session: null });
};

// Get current user
const getCurrentUserHandler: express.RequestHandler<object, AuthResponse> = async (req, res) => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        res.status(401).json({ user: null, session: null, error: 'Not authenticated' });
        return;
    }

    // Get additional user data from the users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
            id,
            email,
            role,
            assistant_access,
            language,
            assigned_assistants,
            default_assistant_id,
            questions,
            created_at,
            updated_at
        `)
        .eq('id', user.id)
        .single();

    if (userError) {
        res.status(400).json({ user: null, session: null, error: userError.message });
        return;
    }

    res.json({ user: userData, session: null });
};

// Create user endpoint
router.post('/create-user', async (req, res) => {
    try {
        const { id, email, role, assistantAccess, language } = req.body;
        console.log('Create user request received:', { id, email, role, assistantAccess, language });

        // Verify the user is authenticated
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.log('No token provided');
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        // Create an admin client
        const adminClient = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY
        );

        // Verify the token and get the user
        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
        if (authError || !user) {
            console.error('Auth error:', authError);
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        console.log('User authenticated:', user.id);

        // First check if user already exists
        const { data: existingUser, error: existingError } = await adminClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (existingUser) {
            console.log('User already exists:', existingUser);
            // User already exists, return the existing user
            res.json({ data: existingUser });
            return;
        }

        console.log('Creating new user record...');
        // Create user record if it doesn't exist
        const { data: userData, error: userError } = await adminClient
            .from('users')
            .insert([{
                id,
                email,
                role,
                assistant_access: assistantAccess,
                language,
                assigned_assistants: []
            }])
            .select()
            .single();

        if (userError) {
            // If error is about unique constraint, user was created in parallel
            if (userError.code === '23505') {
                console.log('Concurrent creation detected, fetching user...');
                const { data: retryUser, error: retryError } = await adminClient
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (retryError) {
                    console.error('Error fetching user after conflict:', retryError);
                    res.status(400).json({ error: retryError.message });
                    return;
                }

                console.log('Retrieved user after concurrent creation:', retryUser);
                res.json({ data: retryUser });
                return;
            }

            console.error('Error creating user:', userError);
            res.status(400).json({ error: userError.message });
            return;
        }

        console.log('User created successfully:', userData);
        res.json({ data: userData });
    } catch (error) {
        console.error('Unexpected error creating user:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Get current user data
router.get('/user', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'No user ID in request' });
            return;
        }

        // Get user data with assigned assistants
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select(`
                id,
                email,
                role,
                assistant_access,
                language,
                assigned_assistants,
                default_assistant_id,
                questions,
                created_at,
                updated_at
            `)
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            res.status(500).json({ error: 'Failed to fetch user data' });
            return;
        }

        type UserDataWithAssistant = Database['public']['Tables']['users']['Row'] & {
            defaultAssistantDetails?: ReturnType<typeof asVapiAssistant>;
        };

        const userDataWithAssistant = userData as UserDataWithAssistant;

        // Get assistant details if user has assigned assistants
        if (userDataWithAssistant && userDataWithAssistant.default_assistant_id) {
            console.log('Fetching assistant details for:', userDataWithAssistant.default_assistant_id);
            try {
                const response = await vapi.assistants.list();
                const assistants = (response as unknown[]).map(asVapiAssistant);
                console.log('Available assistants:', assistants);
                
                const defaultAssistant = assistants.find(a => a.id === userDataWithAssistant.default_assistant_id);
                console.log('Found default assistant:', defaultAssistant);
                
                if (defaultAssistant) {
                    userDataWithAssistant.defaultAssistantDetails = defaultAssistant;
                }
            } catch (error) {
                console.error('Error fetching assistant details:', error);
            }
        }

        console.log('Returning user data:', userDataWithAssistant);
        res.json({ data: userDataWithAssistant });
    } catch (error) {
        console.error('Error in get user endpoint:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Routes
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', getCurrentUserHandler);

const userHandler: express.RequestHandler<Record<string, never>, UserResponse, UserRequestBody> = async (req, res) => {
    try {
        const { access_token } = req.body;
        console.log('Authenticating user with token');

        // Get user from auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(access_token);
        
        if (authError || !user) {
            console.error('Auth error:', authError);
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log('Found auth user:', user);

        // Check if user exists in our users table
        const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            res.status(500).json({ error: 'Failed to fetch user data' });
            return;
        }

        // If user doesn't exist, create a new record
        if (!existingUser) {
            console.log('User not found in database, creating new record for ID:', user.id);
            
            const { data: newUser, error: createError } = await supabaseAdmin
                .from('users')
                .insert([{
                    id: user.id,
                    email: user.email,
                    role: 'user',
                    assistant_access: 'single',
                    language: 'en',
                    assigned_assistants: [],
                    default_assistant_id: null
                }])
                .select()
                .single();

            if (createError) {
                console.error('Error creating user record:', createError);
                res.status(500).json({ error: 'Failed to create user record' });
                return;
            }

            console.log('Created new user record:', newUser);
            res.json({ data: newUser });
            return;
        }

        console.log('Found user in database:', existingUser);
        res.json({ data: existingUser });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

router.post('/user', userHandler);

// Admin user management endpoints
router.post('/admin/users', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        const { email, password, role, assistantAccess, language } = req.body;

        // Create auth user first
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            res.status(400).json({ error: authError.message });
            return;
        }

        // Create user record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .insert([{
                id: authData.user.id,
                email,
                role: role || 'user',
                assistant_access: assistantAccess || 'single',
                language: language || 'en',
                assigned_assistants: [],
                default_assistant_id: null
            }])
            .select()
            .single();

        if (userError) {
            console.error('Database error:', userError);
            res.status(400).json({ error: userError.message });
            return;
        }

        res.json({ data: userData });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/admin/users/:userId', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, assistantAccess, language, assigned_assistants, default_assistant_id } = req.body;

        // Update user metadata in auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role }
        });

        if (authError) {
            console.error('Auth error:', authError);
            res.status(400).json({ error: authError.message });
            return;
        }

        // Update user record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .update({
                role,
                assistant_access: assistantAccess,
                language,
                assigned_assistants,
                default_assistant_id
            })
            .eq('id', userId)
            .select()
            .single();

        if (userError) {
            console.error('Database error:', userError);
            res.status(400).json({ error: userError.message });
            return;
        }

        res.json({ data: userData });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/admin/users/:userId', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        const { userId } = req.params;

        // Delete user from auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth error:', authError);
            res.status(400).json({ error: authError.message });
            return;
        }

        // Delete user record
        const { error: userError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            console.error('Database error:', userError);
            res.status(400).json({ error: userError.message });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all users
router.get('/admin/users', authenticateToken, checkAdminAccess, async (req, res) => {
    try {
        console.log('Fetching all users...');
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
            console.error('Database error:', error);
            res.status(400).json({ error: error.message });
            return;
        }

        console.log('Successfully fetched users:', users?.length);
        res.json({ data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/signup', signUpHandler);

export default router; 