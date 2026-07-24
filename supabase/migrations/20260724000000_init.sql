-- Initial schema: profiles + the one-time risk disclosure acknowledgement
-- required by the onboarding flow (CLAUDE.md §2.1).
-- Every table has Row Level Security enabled; clients can only touch their own rows.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created on first sign-in.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  -- Optional, free-choice; used only to route content (CLAUDE.md §4.5).
  education_level text check (
    education_level in ('secondary', 'undergraduate', 'postgraduate', 'other')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- user_disclosures: explicit, timestamped risk-disclosure acknowledgements.
-- Rows are insert-only from the client; no update or delete policy exists,
-- so an acknowledgement can never be edited or removed by the user.
-- ---------------------------------------------------------------------------
create table public.user_disclosures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  disclosure_key text not null default 'risk_disclosure_v1',
  acknowledged_at timestamptz not null default now(),
  unique (user_id, disclosure_key)
);

alter table public.user_disclosures enable row level security;

create policy "user_disclosures: read own"
  on public.user_disclosures for select
  using (auth.uid() = user_id);

create policy "user_disclosures: insert own"
  on public.user_disclosures for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Keep profiles.updated_at fresh.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
