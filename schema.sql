-- Enable Row Level Security
alter table auth.users enable row level security;

-- Create assistants table first
create table public.assistants (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    model text not null,
    temperature numeric not null,
    max_tokens integer not null,
    system_prompt text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Then create users table with foreign key reference
create table public.users (
    id uuid references auth.users(id) primary key,
    email text not null,
    role text not null check (role in ('admin', 'viewer')),
    assistant_access text not null check (assistant_access in ('single', 'all')),
    language text not null,
    assigned_assistants uuid[] default '{}',
    default_assistant_id uuid references public.assistants(id),
    questions jsonb default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transcripts table last since it references both
create table public.transcripts (
    id uuid default uuid_generate_v4() primary key,
    assistant_id uuid references public.assistants(id) not null,
    user_id uuid references auth.users(id) not null,
    content text not null,
    speaker text not null check (speaker in ('user', 'assistant')),
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.assistants enable row level security;
alter table public.transcripts enable row level security;

-- Create policies
create policy "Users can view own data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update own data"
    on public.users for update
    using (auth.uid() = id);

create policy "Users can view assigned assistants"
    on public.assistants for select
    using (
        exists (
            select 1 from public.users
            where id = auth.uid()
            and (
                assistant_access = 'all'
                or id = any(assigned_assistants)
            )
        )
    );

create policy "Users can view own transcripts"
    on public.transcripts for select
    using (
        auth.uid() = user_id
        and exists (
            select 1 from public.users
            where id = auth.uid()
            and (
                assistant_access = 'all'
                or assistant_id = any(assigned_assistants)
            )
        )
    );

-- Create triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
    before update on public.users
    for each row
    execute function update_updated_at_column();

create trigger update_assistants_updated_at
    before update on public.assistants
    for each row
    execute function update_updated_at_column();

create trigger update_transcripts_updated_at
    before update on public.transcripts
    for each row
    execute function update_updated_at_column(); 