-- ============================================================
--  WoowPay Loyalty — Supabase Schema
--  Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================
--
-- ⚠️ SECURITY MIGRATION — 2026-08-06
-- Run the "MIGRATION" block near the bottom of this file against your
-- EXISTING live project. It fixes two real issues found in review:
--   1. record_spin() incremented spins_used with no upper bound, so
--      anyone holding the public anon key could POST directly to
--      /rest/v1/rpc/record_spin and burn any client's spins past
--      their allotted limit (client-side checks don't stop a direct
--      API call).
--   2. The "Admin full access" policy granted full CRUD to ANY
--      authenticated Supabase user, not just the intended admin.
--      If email sign-ups are enabled in Supabase Auth, anyone who
--      creates an account gets full read/write/delete on all client
--      records. Scope it to the admin account explicitly.
-- The full CREATE statements below are also updated so a fresh
-- deploy starts secure. See the MIGRATION block for the safe
-- drop-and-recreate steps for an already-live database.
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

-- Admin panel access is scoped to the specific admin account only —
-- NOT to every authenticated Supabase user. Update the email below
-- if the admin login ever changes.
create policy "Admin full access"
  on public.clients for all
  using ((auth.jwt() ->> 'email') = 'enkhdulguun.amarbayasgalan@gmail.com');

-- 4. Function to record a spin (called by loyalty site)
--    Uses SECURITY DEFINER so anon can call it safely.
--    Atomically enforces: enabled, spins remaining, and a minimum
--    gap between spins (anti-spam floor — tune COOLDOWN_SECONDS).
--    Returns true if the spin was recorded, false if rejected.
create or replace function public.record_spin(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown_seconds constant int := 2;
  updated_rows int;
begin
  update public.clients
  set
    spins_used   = spins_used + 1,
    last_spin_at = now()
  where code = p_code
    and enabled = true
    and spins_used < spins
    and (last_spin_at is null or last_spin_at < now() - make_interval(secs => cooldown_seconds));

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

-- Allow anon to call record_spin
grant execute on function public.record_spin(text) to anon;

-- 5. Sample data (delete before production)
-- insert into public.clients (name, phone, code, user_type, spins, notes) values
--   ('Энхдулгуун', '99001234', 'WC-AB0021', 'client',   3, 'Test client'),
--   ('WoowPay Test', '88005678', 'WM-XY0013', 'merchant', 1, 'Test merchant');

-- ============================================================
--  MIGRATION — run this block now against your LIVE project
--  (Supabase Dashboard → SQL Editor → paste just this block → Run)
-- ============================================================

drop policy if exists "Admin full access" on public.clients;
create policy "Admin full access"
  on public.clients for all
  using ((auth.jwt() ->> 'email') = 'enkhdulguun.amarbayasgalan@gmail.com');

create or replace function public.record_spin(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown_seconds constant int := 2;
  updated_rows int;
begin
  update public.clients
  set
    spins_used   = spins_used + 1,
    last_spin_at = now()
  where code = p_code
    and enabled = true
    and spins_used < spins
    and (last_spin_at is null or last_spin_at < now() - make_interval(secs => cooldown_seconds));

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

grant execute on function public.record_spin(text) to anon;

-- Also recommended (do this in the Dashboard, not SQL):
-- Authentication → Providers → Email → turn OFF "Allow new users to sign up"
-- so no one but the existing admin account can ever authenticate.
-- ============================================================
