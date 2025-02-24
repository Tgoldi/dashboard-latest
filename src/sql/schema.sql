-- Create users table with questions column
create table if not exists public.users (
    id uuid references auth.users(id) primary key,
    email text not null,
    name text,
    role text not null check (role in ('admin', 'viewer')),
    assistant_access text not null check (assistant_access in ('single', 'all')),
    language text not null,
    assigned_assistants uuid[] default '{}',
    default_assistant_id uuid references public.assistants(id),
    questions jsonb default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view own user data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update own user data"
    on public.users for update
    using (auth.uid() = id);

create policy "Allow insert during signup"
    on public.users for insert
    with check (auth.uid() = id); 