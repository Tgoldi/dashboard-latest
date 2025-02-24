-- Create assistants table
CREATE TABLE IF NOT EXISTS public.assistants (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    language text DEFAULT 'en',
    model jsonb,
    settings jsonb,
    artifact_plan jsonb,
    org_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Add created_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'assistants'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.assistants ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing records to set created_by to the first owner user
UPDATE public.assistants
SET created_by = (
    SELECT id FROM public.users
    WHERE role = 'owner'
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE created_by IS NULL;

-- Enable RLS
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read assistants" ON public.assistants;
DROP POLICY IF EXISTS "Allow admins and owners to manage assistants" ON public.assistants;
DROP POLICY IF EXISTS "service_role_policy" ON public.assistants;
DROP POLICY IF EXISTS "view_assistants_policy" ON public.assistants;
DROP POLICY IF EXISTS "manage_assistants_policy" ON public.assistants;

-- Get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service role policy (has full access)
CREATE POLICY "service_role_policy"
    ON public.assistants
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy for viewing assistants
CREATE POLICY "view_assistants_policy"
    ON public.assistants
    FOR SELECT
    USING (
        CASE
            -- Service role and owners can see all assistants
            WHEN auth.jwt() ->> 'role' = 'service_role' OR
                 EXISTS (
                     SELECT 1 FROM users
                     WHERE users.id = auth.uid()
                     AND users.role = 'owner'::user_role
                 ) THEN true
            -- Admins can only see assistants assigned to users they created
            WHEN EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'::user_role
            ) THEN 
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.created_by = auth.uid()
                    AND (
                        assistants.id = ANY(users.assigned_assistants)
                        OR users.default_assistant_id = assistants.id
                    )
                )
            -- Regular users and editors can only see their assigned assistants
            ELSE EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND (
                    assistants.id = ANY(users.assigned_assistants)
                    OR users.default_assistant_id = assistants.id
                )
            )
        END
    );

-- Policy for managing assistants
CREATE POLICY "manage_assistants_policy"
    ON public.assistants
    FOR ALL
    USING (
        CASE
            -- Service role and owners can manage all assistants
            WHEN auth.jwt() ->> 'role' = 'service_role' OR
                 EXISTS (
                     SELECT 1 FROM users
                     WHERE users.id = auth.uid()
                     AND users.role = 'owner'::user_role
                 ) THEN true
            -- Admins can only manage assistants assigned to users they created
            WHEN EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'::user_role
            ) THEN 
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.created_by = auth.uid()
                    AND (
                        assistants.id = ANY(users.assigned_assistants)
                        OR users.default_assistant_id = assistants.id
                    )
                )
            ELSE false
        END
    )
    WITH CHECK (
        CASE
            -- Service role and owners can manage all assistants
            WHEN auth.jwt() ->> 'role' = 'service_role' OR
                 EXISTS (
                     SELECT 1 FROM users
                     WHERE users.id = auth.uid()
                     AND users.role = 'owner'::user_role
                 ) THEN true
            -- Admins can only manage assistants assigned to users they created
            WHEN EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'::user_role
            ) THEN 
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.created_by = auth.uid()
                    AND (
                        assistants.id = ANY(users.assigned_assistants)
                        OR users.default_assistant_id = assistants.id
                    )
                )
            ELSE false
        END
    );

-- Grant necessary permissions
GRANT ALL ON public.assistants TO authenticated;
GRANT ALL ON public.assistants TO service_role;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_updated_at ON public.assistants;
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.assistants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 