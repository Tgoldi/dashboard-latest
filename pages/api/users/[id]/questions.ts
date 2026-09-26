import { supabase } from '../../lib/supabase-server';

export default async function handler(req, res) {
    const { id } = req.query;

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.id !== id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('users')
            .select('questions')
            .eq('id', id)
            .single();

        if (error) return res.status(400).json({ error });
        return res.json(data.questions);
    }

    if (req.method === 'PUT') {
        const { data, error } = await supabase
            .from('users')
            .update({ questions: req.body })
            .eq('id', id);

        if (error) return res.status(400).json({ error });
        return res.json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
} 