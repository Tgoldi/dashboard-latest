-- Add new columns for assistant names if they don't exist
DO $$ 
BEGIN
    -- Add assigned_assistant_names column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = 'assigned_assistant_names') THEN
        ALTER TABLE users ADD COLUMN assigned_assistant_names text[] DEFAULT '{}';
    END IF;

    -- Add default_assistant_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = 'default_assistant_name') THEN
        ALTER TABLE users ADD COLUMN default_assistant_name text DEFAULT NULL;
    END IF;
END $$;

