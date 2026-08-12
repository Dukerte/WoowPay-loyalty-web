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

-- RLS only restricts which ROWS anon can see, not which COLUMNS —
-- the anon key is public (shipped in the browser bundle), so without
-- an explicit column grant it could otherwise select name/phone for
-- every active client, not just the row its own queries target.
-- Only the columns the public site actually needs are exposed.
revoke all on public.clients from anon;
grant select (id, code, user_type, spins, spins_used, enabled, created_at)
  on public.clients to anon;

-- Phone verification runs server-side (see verify_phone_match below)
-- since phone is no longer anon-selectable at all.
create or replace function public.verify_phone_match(p_code text, p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  select phone into v_phone
  from public.clients
  where code = upper(p_code)
    and enabled = true
    and deleted_at is null;

  if v_phone is null then
    return true; -- no matching/enabled client, or no phone on file → open
  end if;

  return v_phone = p_phone;
end;
$$;

grant execute on function public.verify_phone_match(text, text) to anon;

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

-- 7. bot_config — secrets for the Messenger webhook Edge Function
--    (messenger-webhook). No MCP tool exposes Edge Function secrets
--    directly, so this table is the practical equivalent: the
--    function reads it via the service role at request time. Not
--    exposed to anon/authenticated at all (RLS enabled, zero
--    policies = deny all except service role, which bypasses RLS).
create table if not exists public.bot_config (
  key   text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.bot_config enable row level security;
revoke all on public.bot_config from anon, authenticated;

-- Populate with: messenger_verify_token (chosen by us, pasted into
-- the Meta App's webhook config) and page_access_token (generated by
-- Meta once the App + Page are connected — starts empty).
-- insert into public.bot_config (key, value) values
--   ('messenger_verify_token', '...'),
--   ('page_access_token', '...')
-- on conflict (key) do update set value = excluded.value, updated_at = now();

-- 8. bot_nodes — the Messenger bot's menu content (root → Харилцагч/
--    Мерчант/Урамшуулал and every submenu under them). Edited directly
--    in this table, not in code — messenger-webhook re-reads it on
--    every request, so copy changes need no redeploy. Same lockdown
--    as bot_config: RLS on, zero policies, service-role-only access.
create table if not exists public.bot_nodes (
  key           text primary key,
  text          text not null,
  template_type text not null default 'text'
                  check (template_type in ('text','button','list','generic')),
  quick_replies jsonb not null default '[]'::jsonb, -- [{ "title": "...", "target": "node_key" }]
  buttons       jsonb not null default '[]'::jsonb, -- [{ "type": "web_url"|"phone_number", "title": "...", "url"/"payload": "..." }]
  list_items    jsonb not null default '[]'::jsonb, -- UNUSED IN PRACTICE, see note below
  cards         jsonb not null default '[]'::jsonb, -- [{ "title", "subtitle", "image_url", "buttons": [...] }]
  updated_at    timestamptz not null default now()
);

alter table public.bot_nodes enable row level security;
revoke all on public.bot_nodes from anon, authenticated;

-- template_type controls how messenger-webhook renders a node:
--   text    — plain message + quick-reply chips. Used for leaf/detail
--             screens (guide answers, coming-soon placeholders) where
--             there's nothing to browse, just a message + a couple of
--             next-step chips.
--   button  — Facebook's Button Template (used for the phone-number
--             contact screens; up to 3 buttons).
--   generic — Facebook's Generic Template: a swipeable card carousel
--             (image + title + subtitle + up to 3 buttons per card).
--             Used two ways: (a) as the main MENU screens (root's
--             children — client, client_guide, merchant, merchant_new,
--             merchant_existing) where each card's button is
--             type "postback" pointing at another node key — tapping
--             "Сонгох" navigates the bot exactly like a quick-reply
--             chip did before; and (b) as a single-card "hero" shown
--             before the text message on promo/single-message screens
--             (loan products, app download, wheel prompt, merchant
--             benefits).
--   list    — Facebook's List Template. IMPLEMENTED BUT NOT USABLE:
--             live testing (2026-08-12) showed Facebook's Graph API
--             rejects list templates whose element buttons use type
--             "postback" with a generic "(#-1) Unexpected internal
--             error" — confirmed reproducible with and without
--             image_url. Generic Template's per-card buttons DO support
--             postback fine (confirmed live, see above) — List Template
--             specifically does not. Do not set a node to 'list' unless
--             this is revisited by Meta; the column/code path is left
--             in place just in case.
--
-- Placeholder card images use https://placehold.co/{w}x{h}/10213F/FFD43B.png?text=WoowPay
-- (brand navy/gold) — swap image_url values for real photography/art
-- whenever it's ready; no code change needed, just update the row.
--
-- See the add_client_soft_delete-era migration history / apply_migration
-- calls for the actual seeded node content (root, client, client_loan_
-- purchase, client_loan_cash, client_app, client_guide + 4 leaves,
-- client_contact, merchant, merchant_new + benefits/guide, merchant_
-- existing + sales/find guides, merchant_contact, wheel). Query
-- `select key, text, template_type, quick_replies, buttons, cards from
-- public.bot_nodes` in the SQL editor to see/edit live content.

-- bot_debug_log — diagnostic table added while troubleshooting the list
-- template rejection above. Records any failed Send API call (status
-- code + Graph API error body + the payload that triggered it). Safe to
-- leave in place; locked down the same way as bot_config/bot_nodes.
create table if not exists public.bot_debug_log (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  status_code  int,
  error_body   text,
  payload      jsonb
);
alter table public.bot_debug_log enable row level security;
revoke all on public.bot_debug_log from anon, authenticated;

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
