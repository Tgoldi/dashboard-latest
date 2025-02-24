import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        assistantAccess: string;
        metadata?: Record<string, unknown>;
        [key: string]: string | Record<string, unknown> | undefined;
    };
}

export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log('No token provided');
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        console.log('Verifying token...');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error('Token verification failed:', authError);
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        console.log('Token verified for user:', user.id);

        // Get user data from database
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            res.status(401).json({ error: 'User not found' });
            return;
        }

        console.log('Found user data:', userData);
        req.user = { ...user, ...userData };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

export const checkAdminAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'No user ID in request' });
            return;
        }

        const { data: userData, error } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            res.status(500).json({ error: 'Failed to fetch user data' });
            return;
        }

        if (userData.role !== 'owner' && userData.role !== 'admin') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}; 