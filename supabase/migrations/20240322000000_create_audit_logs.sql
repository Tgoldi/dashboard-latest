-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    action text NOT NULL,
    performed_by uuid REFERENCES auth.users(id),
    target_user text NOT NULL,
    details jsonb,
    timestamp timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Owners can view all audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'owner'
        )
    );

CREATE POLICY "Admins can view their own audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND performed_by = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.audit_logs TO postgres; 