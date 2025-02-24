import { supabase } from '../../lib/supabase-server';

export default async function handler(req, res) {
    const { id } = req.query;
    
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