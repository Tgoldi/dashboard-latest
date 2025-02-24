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
    name text,
    role user_role NOT NULL DEFAULT 'user',
    assistant_access text NOT NULL DEFAULT 'single',
    language text NOT NULL DEFAULT 'en',
    assigned_assistants text[] DEFAULT '{}',
    assigned_assistant_names text[] DEFAULT '{}',
    default_assistant_id text DEFAULT NULL,
    default_assistant_name text DEFAULT NULL,
    questions jsonb DEFAULT NULL,
    qa_form_submitted boolean DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- First, disable RLS to ensure we can modify policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update own user data" ON public.users;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow first login insert" ON public.users;
DROP POLICY IF EXISTS "Public insert access" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can modify own data" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Public can insert" ON public.users;
DROP POLICY IF EXISTS "Authenticated can read own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated can update own data" ON public.users;
DROP POLICY IF EXISTS "trigger_insert_policy" ON public.users;
DROP POLICY IF EXISTS "user_read_policy" ON public.users;
DROP POLICY IF EXISTS "user_update_policy" ON public.users;
DROP POLICY IF EXISTS "admin_all_policy" ON public.users;
DROP POLICY IF EXISTS "service_role_policy" ON public.users;

-- Create policies with security definer
CREATE POLICY "service_role_policy"
    ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "user_read_policy"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "user_update_policy"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_all_policy"
    ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND (
                raw_user_meta_data->>'role' = 'admin'
                OR raw_user_meta_data->>'role' = 'owner'
            )
        )
    );

-- Add policy for trigger-based inserts
CREATE POLICY "trigger_insert_policy"
    ON public.users
    FOR INSERT
    WITH CHECK (true);  -- Allow inserts from trigger function

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;

-- Create or replace the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _name text;
    _role user_role;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user: Starting for user_id: %, email: %', NEW.id, NEW.email;

    -- Get name with fallback
    _name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), '');
    
    -- Set role to 'user' for new registrations
    _role := 'user'::user_role;

    -- Direct insert with error handling
    BEGIN
        INSERT INTO public.users (
            id,
            email,
            name,
            role,
            assistant_access,
            language,
            assigned_assistants,
            assigned_assistant_names,
            default_assistant_id,
            default_assistant_name
        )
        VALUES (
            NEW.id,
            NEW.email,
            _name,
            _role,
            'single',
            'en',
            '{}',
            '{}',
            NULL,
            NULL
        );
        
        RAISE LOG 'handle_new_user: Successfully created user record for %', NEW.id;
        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Failed to create user record: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        RETURN NULL;
    END;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION create_new_user(
    user_id uuid,
    user_email text,
    user_name text,
    user_questions jsonb
) RETURNS users AS $$
DECLARE
    new_user users;
BEGIN
    INSERT INTO users (
        id,
        email,
        name,
        role,
        assistant_access,
        language,
        assigned_assistants,
        default_assistant_id,
        questions
    ) VALUES (
        user_id,
        user_email,
        user_name,
        'user'::user_role,
        'single',
        'en',
        '{}',
        NULL,
        user_questions
    )
    RETURNING * INTO new_user;
    
    RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;