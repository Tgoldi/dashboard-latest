-- Add phone_numbers table first
CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    number VARCHAR NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop all policies that might depend on the role column
DROP POLICY IF EXISTS "Allow admins and editors full access to phone numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Editors can update their own questions" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Owners have full access" ON public.users;
DROP POLICY IF EXISTS "Admins can manage specific assistants" ON public.users;

-- First drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Temporarily alter the role column to accept any string
ALTER TABLE public.users ALTER COLUMN role TYPE VARCHAR;

-- Update existing users to have valid roles
UPDATE public.users 
SET role = 'user' 
WHERE role NOT IN ('admin', 'editor', 'user', 'owner');

-- Now alter the column to use the existing enum type
ALTER TABLE public.users 
    ALTER COLUMN role TYPE public.user_role 
    USING role::public.user_role;

-- Add the check constraint
ALTER TABLE public.users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'editor', 'user', 'owner'));

-- Add RLS policies for phone_numbers
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins and editors full access to phone numbers"
    ON public.phone_numbers
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'editor', 'owner'));

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add policy for editors to read/update their own data
CREATE POLICY "Users can read their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Editors can update their own questions"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = 'editor');

-- Allow admins and owners full access
CREATE POLICY "Admins and owners have full access"
    ON public.users
    FOR ALL
    USING (
        CASE
            WHEN auth.jwt() ->> 'role' = 'owner' THEN true
            WHEN auth.jwt() ->> 'role' = 'admin' THEN
                -- Admins can manage users they created and can only create editors and users
                (created_by = auth.uid() AND role IN ('editor', 'user'))
                OR id = auth.uid()
            ELSE false
        END
    );

-- Allow service role to manage all users
CREATE POLICY "Service role can manage all users"
    ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role'); 