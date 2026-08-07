-- ============================================================
--  WoowPay Loyalty — Supabase Schema
--  Paste this entire file into Supabase → SQL Editor → Run
--  (idempotent — safe to re-run on a fresh or existing project)
--
--  Status: this file matches what is LIVE on project
--  jamlxsllyqscxydkkwhe as of 2026-08-06. Both migrations below
--  (security fix + prize logging) have already been applied
--  directly via the Supabase MCP connector.
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
  notes        text,
  -- Soft-delete: set by the admin panel's "trash" action. A trashed
  -- client's code stops working immediately (see policy + record_spin
  -- below) but the row is kept until someone explicitly deletes it
  -- forever from the trash view.
  deleted_at   timestamptz
);

-- 2. Index for fast code lookups
create index if not exists clients_code_idx on public.clients (code);
create index if not exists clients_phone_idx on public.clients (phone);
create index if not exists clients_deleted_at_idx on public.clients (deleted_at);

-- 3. Row Level Security — clients
alter table public.clients enable row level security;

-- Anon users (loyalty site) can read enabled, non-trashed clients
drop policy if exists "Anon read enabled clients" on public.clients;
create policy "Anon read enabled clients"
  on public.clients for select
  using (enabled = true and deleted_at is null);

-- Admin panel access is scoped to the specific admin account only —
-- NOT to every authenticated Supabase user. Update the email below
-- if the admin login ever changes.
drop policy if exists "Admin full access" on public.clients;
create policy "Admin full access"
  on public.clients for all
  using ((auth.jwt() ->> 'email') = 'enkhdulguun.amarbayasgalan@gmail.com');

-- 4. spin_results — logs which prize each spin actually won, and
--    whether that reward has been fulfilled/paid out to the client.
--    Without this table there is NO record anywhere of what a
--    client won — only that they spun (spins_used count).
create table if not exists public.spin_results (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references public.clients(id) on delete set null,
  code         text not null,
  prize_label  text not null,
  fulfilled    boolean not null default false,
  fulfilled_at timestamptz,
  fulfilled_by text,
  notes        text,
  won_at       timestamptz not null default now()
);

create index if not exists spin_results_client_idx on public.spin_results (client_id);
create index if not exists spin_results_code_idx on public.spin_results (code);
create index if not exists spin_results_fulfilled_idx on public.spin_results (fulfilled);

alter table public.spin_results enable row level security;

-- Only the admin can read/update spin_results directly. Anon gets no
-- policy here — the only way a row is inserted is through the
-- record_spin() SECURITY DEFINER function below, which bypasses RLS
-- as the table owner.
drop policy if exists "Admin full access" on public.spin_results;
create policy "Admin full access"
  on public.spin_results for all
  using ((auth.jwt() ->> 'email') = 'enkhdulguun.amarbayasgalan@gmail.com');

-- 5. record_spin — called by the loyalty site after the wheel lands.
--    Uses SECURITY DEFINER so anon can call it safely.
--    Atomically enforces: enabled, spins remaining, and a minimum
--    gap between spins (anti-spam floor — tune cooldown_seconds).
--    Logs the prize into spin_results if the spin counted.
--    Returns true only if the spin was actually recorded.
drop function if exists public.record_spin(text);
create or replace function public.record_spin(p_code text, p_prize_label text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown_seconds constant int := 2;
  updated_rows int;
  v_client_id uuid;
begin
  update public.clients
  set
    spins_used   = spins_used + 1,
    last_spin_at = now()
  where code = p_code
    and enabled = true
    and deleted_at is null
    and spins_used < spins
    and (last_spin_at is null or last_spin_at < now() - make_interval(secs => cooldown_seconds))
  returning id into v_client_id;

  get diagnostics updated_rows = row_count;

  if updated_rows > 0 and p_prize_label is not null then
    insert into public.spin_results (client_id, code, prize_label)
    values (v_client_id, p_code, p_prize_label);
  end if;

  return updated_rows > 0;
end;
$$;

grant execute on function public.record_spin(text, text) to anon;

-- 6. Sample data (delete before production)
-- insert into public.clients (name, phone, code, user_type, spins, notes) values
--   ('Энхдулгуун', '99001234', 'WC-AB0021', 'client',   3, 'Test client'),
--   ('WoowPay Test', '88005678', 'WM-XY0013', 'merchant', 1, 'Test merchant');

-- ============================================================
-- Still recommended, dashboard-only (not SQL):
--   Authentication → Providers → Email → turn OFF "Allow new
--   users to sign up" so no one but the existing admin account
--   can ever authenticate against the "Admin full access" policies.
--   Authentication → Policies → turn ON "Leaked password protection".
-- ============================================================

-- ============================================================
-- Useful queries for looking up what a client won:
--
-- select c.name, c.code, r.prize_label, r.won_at, r.fulfilled
-- from public.spin_results r
-- join public.clients c on c.id = r.client_id
-- where c.name ilike '%name here%'
-- order by r.won_at desc;
--
-- To manually mark a prize as paid out / awarded:
-- update public.spin_results
-- set fulfilled = true, fulfilled_at = now(), fulfilled_by = 'admin'
-- where id = '...';
-- ============================================================
