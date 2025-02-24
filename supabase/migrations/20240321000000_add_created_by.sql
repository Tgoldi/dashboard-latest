-- Add created_by column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can manage data" ON users;
DROP POLICY IF EXISTS "admin_all_policy" ON users;
DROP POLICY IF EXISTS "service_role_policy" ON users;
DROP POLICY IF EXISTS "view_users_policy" ON users;
DROP POLICY IF EXISTS "insert_users_policy" ON users;
DROP POLICY IF EXISTS "update_users_policy" ON users;
DROP POLICY IF EXISTS "delete_users_policy" ON users;

-- Service role policy (has full access)
CREATE POLICY "service_role_policy"
    ON users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy for viewing users (SELECT)
CREATE POLICY "view_users_policy"
    ON users
    FOR SELECT
    USING (
        CASE
            -- Service role can see all users
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            -- Users with role 'owner' can see all users
            WHEN users.role = 'owner'::user_role THEN true
            -- Admins can see users they created and their own record
            WHEN users.role = 'admin'::user_role THEN users.id = auth.uid() OR users.created_by = auth.uid()
            -- Regular users and editors can only see their own record
            ELSE users.id = auth.uid()
        END
    );

-- Get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for inserting users (INSERT)
CREATE POLICY "insert_users_policy"
    ON users
    FOR INSERT
    WITH CHECK (
        CASE
            -- Service role can create any user
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            -- Users with role 'owner' can create any user
            WHEN get_auth_user_role() = 'owner'::user_role THEN true
            -- Admins can only create editor and user roles
            WHEN get_auth_user_role() = 'admin'::user_role THEN 
                role IN ('editor'::user_role, 'user'::user_role)
            ELSE false
        END
    );

-- Policy for updating users (UPDATE)
CREATE POLICY "update_users_policy"
    ON users
    FOR UPDATE
    USING (
        CASE
            -- Service role can update any user
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            -- Users with role 'owner' can update any user
            WHEN get_auth_user_role() = 'owner'::user_role THEN true
            -- Admins can update users they created and their own record
            WHEN get_auth_user_role() = 'admin'::user_role THEN id = auth.uid() OR created_by = auth.uid()
            -- Regular users and editors can only update their own record
            ELSE id = auth.uid()
        END
    )
    WITH CHECK (
        CASE
            -- Service role can do anything
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            -- Users with role 'owner' can do anything
            WHEN get_auth_user_role() = 'owner'::user_role THEN true
            -- Admins can update their own record or manage editor/user roles
            WHEN get_auth_user_role() = 'admin'::user_role THEN 
                (id = auth.uid()) OR
                (created_by = auth.uid() AND role IN ('editor'::user_role, 'user'::user_role))
            -- Regular users can only update their own non-role fields
            ELSE id = auth.uid() AND role = get_auth_user_role()
        END
    );

-- Policy for deleting users (DELETE)
CREATE POLICY "delete_users_policy"
    ON users
    FOR DELETE
    USING (
        CASE
            -- Service role can delete any user
            WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
            -- Users with role 'owner' can delete any user
            WHEN get_auth_user_role() = 'owner'::user_role THEN true
            -- Admins can only delete users they created
            WHEN get_auth_user_role() = 'admin'::user_role THEN created_by = auth.uid()
            ELSE false
        END
    );

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;