-- ============================================================
--  WoowPay Loyalty — Supabase Schema
--  Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- 1. Clients table
create table if not exists public.clients (
  id           uuid        default gen_random_uuid() primary key,
  name         text        not null,
  phone        text        not null,
  code         text        unique not null,
  user_type    text        not null default 'client'
                           check (user_type in ('merchant', 'client')),
  spins        integer     not null default 1,
  spins_used   integer     not null default 0,
  enabled      boolean     not null default true,
  last_spin_at timestamptz,
  created_at   timestamptz default now(),
  notes        text
);

-- 2. Index for fast code lookups
create index if not exists clients_code_idx on public.clients (code);
create index if not exists clients_phone_idx on public.clients (phone);

-- 3. Row Level Security
alter table public.clients enable row level security;

-- Anon users (loyalty site) can read enabled clients
create policy "Anon read enabled clients"
  on public.clients for select
  using (enabled = true);

-- Authenticated users (admin panel) have full access
create policy "Admin full access"
  on public.clients for all
  using (auth.role() = 'authenticated');

-- 4. Function to record a spin (called by loyalty site)
--    Uses SECURITY DEFINER so anon can call it safely
create or replace function public.record_spin(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients
  set
    spins_used   = spins_used + 1,
    last_spin_at = now()
  where code = p_code
    and enabled  = true;
end;
$$;

-- Allow anon to call record_spin
grant execute on function public.record_spin(text) to anon;

-- 5. Sample data (delete before production)
-- insert into public.clients (name, phone, code, user_type, spins, notes) values
--   ('Энхдулгуун', '99001234', 'WC-AB0021', 'client',   3, 'Test client'),
--   ('WoowPay Test', '88005678', 'WM-XY0013', 'merchant', 1, 'Test merchant');
