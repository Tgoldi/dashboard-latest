-- Save the view definition if it exists
DO $$ 
BEGIN
    -- Create temp table to store view definition
    CREATE TEMP TABLE IF NOT EXISTS tmp_profiles_view (view_definition text);
    
    -- Try to save the view definition if it exists
    BEGIN
        INSERT INTO tmp_profiles_view
        SELECT pg_get_viewdef('profiles'::regclass);
    EXCEPTION 
        WHEN undefined_table THEN
            -- View doesn't exist, that's fine
            NULL;
    END;
END $$;

-- Drop the profiles view and users table if they exist
DROP VIEW IF EXISTS profiles;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing type if it exists
DROP TYPE IF EXISTS user_role CASCADE;

-- Create an enum type for roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'editor', 'owner');

-- Create the users table with the correct type
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    assistant_access text NOT NULL DEFAULT 'single',
    language text NOT NULL DEFAULT 'en',
    assigned_assistants text[] DEFAULT '{}',
    default_assistant_id text DEFAULT NULL,
    questions jsonb DEFAULT NULL,
    qa_form_submitted boolean DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Recreate the profiles view if it existed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM tmp_profiles_view WHERE view_definition IS NOT NULL) THEN
        EXECUTE (SELECT view_definition FROM tmp_profiles_view LIMIT 1);
    END IF;
EXCEPTION 
    WHEN undefined_table THEN
        -- Temp table doesn't exist, that's fine
        NULL;
END $$;

-- Clean up
DROP TABLE IF EXISTS tmp_profiles_view;

-- Drop all existing policies
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_update ON users;
DROP POLICY IF EXISTS users_delete ON users;
DROP POLICY IF EXISTS "Owners have full access" ON users;
DROP POLICY IF EXISTS "Admins can access their assigned assistants" ON users;
DROP POLICY IF EXISTS "Editors can access their single assistant" ON users;
DROP POLICY IF EXISTS "Users can read their single assistant" ON users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON users;
DROP POLICY IF EXISTS "Owners and admins can manage assistants" ON assistants;
DROP POLICY IF EXISTS "Owners and admins can read all data" ON users;
DROP POLICY IF EXISTS "Admins can modify all data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for different roles
-- Owner policies (full access to everything except QA form modification)
CREATE POLICY "Owners have full access"
    ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'owner'::user_role
        )
    )
    WITH CHECK (
        CASE 
            WHEN questions IS DISTINCT FROM (SELECT questions FROM users WHERE id = auth.uid()) THEN FALSE
            ELSE TRUE
        END
    );

-- Admin policies (access to assigned assistants, can't modify QA)
CREATE POLICY "Admins can access their assigned assistants"
    ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'::user_role
            AND EXISTS (
                SELECT 1 FROM users admin 
                WHERE admin.id = auth.uid() 
                AND admin.assigned_assistants && users.assigned_assistants
            )
        )
    )
    WITH CHECK (
        CASE 
            WHEN questions IS DISTINCT FROM (SELECT questions FROM users WHERE id = auth.uid()) THEN FALSE
            ELSE TRUE
        END
    );

-- Editor policies (single assistant access + QA form on first login)
CREATE POLICY "Editors can access their single assistant"
    ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'editor'::user_role
            AND assistant_access = 'single'
            AND EXISTS (
                SELECT 1 FROM users editor 
                WHERE editor.id = auth.uid() 
                AND editor.default_assistant_id = users.default_assistant_id
            )
        )
    )
    WITH CHECK (
        CASE 
            -- Only allow QA form update if it hasn't been submitted yet
            WHEN questions IS DISTINCT FROM (SELECT questions FROM users WHERE id = auth.uid()) THEN 
                NOT (SELECT qa_form_submitted FROM users WHERE id = auth.uid()) AND auth.uid() = id
            ELSE TRUE
        END
    );

-- User policies (read-only access to single assistant)
CREATE POLICY "Users can read their single assistant"
    ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'user'::user_role
            AND (
                auth.uid() = users.id
                OR (
                    assistant_access = 'single'
                    AND default_assistant_id = (
                        SELECT default_assistant_id 
                        FROM users 
                        WHERE id = auth.uid()
                    )
                )
            )
        )
    );

-- Allow users to update their own basic info (excluding QA form)
CREATE POLICY "Users can update their own basic info"
    ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND (
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role = 'user'::user_role
                ) THEN 
                    -- Users can't change their role, assistant access, or QA form
                    assistant_access = (SELECT assistant_access FROM users WHERE id = auth.uid())
                    AND default_assistant_id = (SELECT default_assistant_id FROM users WHERE id = auth.uid())
                    AND questions = (SELECT questions FROM users WHERE id = auth.uid())
                WHEN EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role = 'editor'::user_role
                ) THEN
                    -- Editors can only update QA form if not submitted
                    assistant_access = 'single'
                    AND (
                        questions = (SELECT questions FROM users WHERE id = auth.uid()) 
                        OR NOT (SELECT qa_form_submitted FROM users WHERE id = auth.uid())
                    )
                ELSE 
                    -- Admins and owners can't modify QA form
                    questions = (SELECT questions FROM users WHERE id = auth.uid())
            END
        )
    );

-- Create a function to handle new user creation in public schema
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'role'::user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 