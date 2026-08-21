-- ============================================================
--  WoowPay Loyalty — Supabase Schema
--  Paste this entire file into Supabase → SQL Editor → Run
--  (idempotent — safe to re-run on a fresh or existing project)
--
--  Status: this file matches what is LIVE on project
--  jamlxsllyqscxydkkwhe as of 2026-08-12. Both migrations below
--  (security fix + prize logging) have already been applied
--  directly via the Supabase MCP connector. bot_nodes content is
--  edited live via SQL, not migrations — see section 8 below for
--  the current structure and messenger-webhook is on v9.
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
--             Used two ways: (a) as MENU screens, including root itself
--             — each card's button is type "postback" pointing at
--             another node key, so tapping "Сонгох" navigates the bot
--             exactly like a quick-reply chip did before; and (b) as a
--             single-card "hero" shown before the text message on
--             promo/single-message screens (loan products, app
--             download, wheel prompt, merchant benefits).
--
-- Navigation conventions baked into the current content (not enforced
-- by code, just how every node's quick_replies are written):
--   - "Буцах" is split into two chips: "← Өмнөх цэс" (immediate parent)
--     and "🏠 Нүүр цэс" (root). Nodes whose only parent IS root
--     (client, merchant, loyalty, wheel) just get "🏠 Нүүр цэс" since
--     both would be identical. (Shortened from the original "Өмнөх цэс
--     рүү буцах" / "Нүүр хуудас буцах" labels on 2026-08-12 — kept
--     under Facebook's 20-char quick-reply title limit and reads
--     cleaner.)
--   - Every node also carries a persistent "Ажилтантай холбогдох" chip
--     (added 2026-08-12) so a human handoff is reachable from any
--     screen in the bot, not just dead-end/leaf nodes.
--   - "Ажилтантай холбогдох" never links directly to a phone-button
--     screen — it always goes through contact_choice first
--     ("Утсаар холбогдох 📞" → contact, the phone-button screen /
--     "Чатаар холбогдох 💬" → chat, a plain "type your question here"
--     handoff message). contact_choice/contact/chat are UNIVERSAL —
--     shared by every branch. The original duplicated per-branch
--     versions (client_contact_choice/client_contact/client_chat and
--     merchant_contact_choice/merchant_contact/merchant_chat, which had
--     identical content) were deleted 2026-08-12 once every node's
--     quick_replies was repointed at the shared nodes.
--   - root's third card is "WooW оноо & Урамшуулал 🎁" → the loyalty
--     node (4-card carousel: WooW оноо⭐, Loyalty💳, Идэвхтэй
--     урамшуулал🎉, Урамшууллын хүрд🎁→wheel). Replaces the old setup
--     where the wheel campaign was root's third card directly — a
--     temporary promo no longer permanently occupies a third of the
--     home screen. loyalty_points/loyalty_program/loyalty_active are
--     "coming soon" placeholder leaves pending real content.
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
-- Customer (client) and Merchant menus were restructured 2026-08-12
-- around jobs-to-be-done instead of products — e.g. client no longer
-- opens straight into loan-product cards, it opens into "Зээлийн эрх &
-- нөхцөл" / "Зээл төлөх / сунгах" / "Худалдан авалт хийх" / "Апп &
-- бүртгэл" / "WooW оноо & урамшуулал" / "Тусламж". Same pattern applied
-- to merchant. The old flat "client_guide" and "merchant_existing"
-- wrapper submenus were retired — their children now hang directly off
-- the new job-based parents.
--
-- See the add_client_soft_delete-era migration history / apply_migration
-- calls for the full seeded node content. Current node set (2026-08-12):
-- root (4 cards incl. WooW Зөвлөх), client, client_loan_terms + its 2
-- loan-type leaves, client_loan_manage + pay/extend leaves,
-- client_guide_purchase (leaf), client_app_register + app/register
-- leaves, merchant, merchant_new + benefits/guide, merchant_criteria
-- (stub), merchant_sales_guide (leaf), merchant_settlement (stub),
-- merchant_find_guide (leaf), loyalty + 3 coming-soon leaves
-- (loyalty_points/loyalty_program/loyalty_active), wheel, and the
-- universal contact_choice/contact/chat trio. Query `select key, text,
-- template_type, quick_replies, buttons, cards from public.bot_nodes`
-- in the SQL editor to see/edit live content.

-- Native persistent menu (the ≡ icon next to Messenger's text composer,
-- always visible) is set directly via the Graph API
-- (/me/messenger_profile), NOT through bot_nodes — it's Page-level
-- config, not conversation content. Currently 3 flat items mirroring
-- root's first 3 cards (Харилцагч/Мерчант/WooW оноо & Урамшуулал).
-- Facebook's nested/multi-level persistent submenus are effectively
-- dead: live testing on 2026-08-12 showed `type: "nested"` always
-- returns `(#100) Invalid button type` regardless of payload, so the
-- menu is capped at 3 flat items with no working way to group more
-- under a submenu. To change it, re-POST persistent_menu with the
-- Page's access token (found in bot_config) — the get_started button
-- must already be set first, or Facebook rejects the request with
-- "(#100) You must set a Get Started button if you also wish to use
-- persistent menu."

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
-- 9. Signed deep-link tokens — skip the manual "confirm phone"
--    screen for clients coming straight from the Messenger
--    "Хүрдээ эргүүлэх" button.
--
--    The messenger-webhook edge function signs a short-lived token
--    (HMAC-SHA256 over code|phone|expiry, using the shared secret
--    stored below) and appends it to the button URL as `&t=...`.
--    The web app calls verify_link_token(code, token) on load; if
--    valid, it skips straight to the wheel. Any link without a
--    valid/unexpired token (bare code typed in, old forwarded link,
--    tampered token) falls back to the existing manual phone screen
--    — verify_phone_match above is untouched and still guards that
--    path.
--
--    IMPORTANT: the value inserted into app_secrets below MUST be
--    set as the EXACT same string in the messenger-webhook edge
--    function's secret (Supabase Dashboard → Edge Functions →
--    messenger-webhook → Secrets → LINK_TOKEN_SECRET), or token
--    verification will always fail.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
-- Intentionally no policies — RLS with zero policies denies anon
-- and authenticated entirely. Only SECURITY DEFINER functions
-- (which run as the table owner, bypassing RLS) can read this.

-- Replace the placeholder below with the real secret before running,
-- then set the identical value as the edge function's
-- LINK_TOKEN_SECRET. Re-running this INSERT later rotates the
-- secret (instantly invalidates all outstanding links).
insert into public.app_secrets (key, value)
values ('link_token_secret', 'REPLACE_WITH_GENERATED_SECRET')
on conflict (key) do update set value = excluded.value;

create or replace function public.verify_link_token(p_code text, p_token text)
returns table (
  valid     boolean,
  user_type text,
  spins     integer,
  phone     text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret   text;
  v_expiry   bigint;
  v_sig      text;
  v_expected text;
  v_client   record;
begin
  if p_token is null or position('.' in p_token) = 0 then
    return query select false, null::text, null::integer, null::text;
    return;
  end if;

  v_expiry := nullif(split_part(p_token, '.', 1), '')::bigint;
  v_sig    := split_part(p_token, '.', 2);

  if v_expiry is null or v_expiry < extract(epoch from now()) then
    return query select false, null::text, null::integer, null::text;
    return;
  end if;

  select value into v_secret from public.app_secrets where key = 'link_token_secret';
  if v_secret is null then
    return query select false, null::text, null::integer, null::text;
    return;
  end if;

  select c.id, c.user_type, c.spins, c.spins_used, c.phone, c.enabled, c.deleted_at
    into v_client
  from public.clients c
  where c.code = upper(p_code)
  limit 1;

  if v_client.id is null or v_client.enabled = false or v_client.deleted_at is not null then
    return query select false, null::text, null::integer, null::text;
    return;
  end if;

  v_expected := encode(
    hmac(
      (upper(p_code) || '|' || coalesce(v_client.phone, '') || '|' || v_expiry::text)::bytea,
      v_secret::bytea,
      'sha256'
    ),
    'hex'
  );

  if v_expected <> v_sig then
    return query select false, null::text, null::integer, null::text;
    return;
  end if;

  return query select true, v_client.user_type, (v_client.spins - v_client.spins_used), v_client.phone;
end;
$$;

grant execute on function public.verify_link_token(text, text) to anon;

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
