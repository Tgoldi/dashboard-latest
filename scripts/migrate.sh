#!/bin/bash

# Load environment variables
source .env

# Apply migrations
supabase db reset

# Seed initial data
psql "$DATABASE_URL" << EOF
INSERT INTO public.assistants (id, name, description, language, model)
VALUES 
    ('default', 'Default Assistant', 'General purpose assistant', 'en', '{"name": "gpt-4"}'),
    ('hebrew', 'Hebrew Assistant', 'Hebrew language assistant', 'he', '{"name": "gpt-4"}');
EOF

echo "Migration and seeding completed successfully!" 