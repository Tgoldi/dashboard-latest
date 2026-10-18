#!/bin/bash

# Load only the database URL from the local .env file (do not export everything)
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is not set" >&2
    exit 1
fi

# Apply migrations
supabase db reset

# Seed initial data
psql "$DATABASE_URL" << 'EOF'
INSERT INTO public.assistants (id, name, description, language, model)
VALUES 
    (gen_random_uuid(), 'Default Assistant', 'General purpose assistant', 'en', '{"name": "gpt-4"}'),
    (gen_random_uuid(), 'Hebrew Assistant', 'Hebrew language assistant', 'he', '{"name": "gpt-4"}');
EOF

echo "Migration and seeding completed successfully!" 