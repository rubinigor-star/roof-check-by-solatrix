create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'sales',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  lead_number text unique not null,
  name text,
  phone text,
  email text,
  address text,
  city text,
  monthly_bill numeric,
  status text not null default 'חדש',
  source text not null default 'roof_check',
  roof_type text,
  surfaces jsonb not null default '[]'::jsonb,
  obstacles jsonb not null default '[]'::jsonb,
  calculation jsonb not null default '{}'::jsonb,
  report_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;

create policy "profiles_self_read" on public.profiles
for select using (auth.uid() = id);

create policy "leads_authenticated_read" on public.leads
for select to authenticated using (true);

create policy "leads_authenticated_write" on public.leads
for all to authenticated using (true) with check (true);

create policy "lead_events_authenticated_read" on public.lead_events
for select to authenticated using (true);

create policy "lead_events_authenticated_write" on public.lead_events
for insert to authenticated with check (true);
