# WoowPay Loyalty System — Full Handoff (for Tpay duplication)

This document is a complete technical + operational snapshot of the WoowPay Loyalty system, written so a fresh Claude chat can duplicate it for **Tpay** with zero prior context. Paste/attach this at the start of the new chat.

Goal for the new chat: **exact structural duplication first** (same schema, same RPCs, same bot logic, same admin panel, same web app), Tpay-specific branding/config to follow later. Backend will be a brand-new, separate Supabase project (different email/account). Facebook Page + Meta Developer App for Tpay already exist. Web app will deploy to a temporary Vercel URL for now (no custom domain yet).

---

## 1. System overview

Three parts, one Supabase project gluing them together:

1. **Public web app** (`loyalty.woowpay.mn`) — a Vite/TypeScript static site. Client enters a redeem code (`WC-XXXXXX`) + phone number, gets verified, then spins a prize wheel.
2. **Facebook Messenger bot** — a Supabase Edge Function (`messenger-webhook`) implementing a menu-driven chatbot on the WoowPay Facebook Page. Clients can request their code by typing their phone number.
3. **Admin panel** (`loyalty.woowpay.mn/admin`) — a single self-contained `admin.html` file, Supabase-auth-gated, for staff to manage clients, prizes/odds, and fulfillment.

All three talk to the same Supabase Postgres database via PostgREST (anon key from the web app, service-role key from the edge function, an authenticated admin session from admin.html).

---

## 2. Repo / hosting / infra identifiers (WoowPay — for reference, Tpay needs its own)

- GitHub repo: `Dukerte/WoowPay-loyalty-web.git`, branch `main`.
- Vercel: team `dukertes-projects` (`team_b6XIzNJYwzbAeip80hPW0Y78`), project `woow-pay-loyalty-web` (`prj_5AkaFWrJHu73UF8dbeCZwXDXzqku`). Auto-deploys on push to `main`.
- Supabase project id: `jamlxsllyqscxydkkwhe`.
- Meta App: "WoowPay Loyalty Bot", App ID `1047171891241871`. Permissions requested: `pages_show_list`, `pages_manage_metadata`, `pages_messaging` (currently Standard Access; App Review submitted, blocked only on Business/Tech-Provider Verification as of last check — not something Claude can complete, it's the account owner's identity verification).
- Sandbox git push doesn't have GitHub credentials — every code change gets pushed by the user from their own terminal with commands Claude provides.

**For Tpay:** new Supabase project (user creates, possibly billable — confirm cost before creating), new GitHub repo (or new branch), new Vercel project → temporary `*.vercel.app` URL for now, existing Tpay Facebook Page + Meta Developer App (user already has these — will need the Page Access Token and a verify token to wire up the bot).

---

## 3. Database schema (Supabase Postgres)

### `clients`
| column | type | notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| name | text | |
| phone | text | **8-digit Mongolian number, no `976` prefix, no formatting.** All matching/dedup logic normalizes to this. |
| code | text | UNIQUE. Format `WM-XXXXXX` (merchant) or `WC-XXXXXX` (client), 6-char alphanumeric suffix from a confusion-free alphabet (`ABCDEFGHJKMNPQRSTUVWXYZ23456789` — no 0/O, 1/I/L). |
| user_type | text | `'merchant'` \| `'client'` |
| spins | int | total spins granted (default 1) |
| spins_used | int | default 0 |
| enabled | bool | default true |
| last_spin_at | timestamptz | nullable — also used for a 2-second spin cooldown |
| created_at | timestamptz | default now() |
| notes | text | nullable |
| deleted_at | timestamptz | nullable — soft delete ("trash") |

RLS policies on `clients`:
- `Admin full access` (ALL commands): `(auth.jwt() ->> 'email') = 'admin@woowpay.mn'` — **hardcoded single admin email**. For Tpay, this needs to be the Tpay admin's email.
- `Anon read enabled clients` (SELECT only): `enabled = true AND deleted_at IS NULL`.
- The anon key does **not** have column-level grants on `name`/`phone` — the public web app can only select `id, code, spins, spins_used, enabled, user_type` explicitly (an implicit `select=*` fails with a permission error). Phone verification is done server-side via the `verify_phone_match` RPC so the raw phone number is never exposed to the browser.

### `spin_results`
One row per spin. `client_id` FK → `clients.id`. Columns: `id, client_id, code, prize_label, fulfilled, fulfilled_at, fulfilled_by, notes, won_at`.
`fulfilled_by` is either a staff email (manual) or `'Систем (автомат)'` / `'Систем (автомат, зассан)'` (auto-fulfilled by the system, the latter suffix meaning "fixed retroactively via backfill").

### `prizes`
The wheel's prize/odds table. Columns: `id, user_type, label, short_label, emoji, color, description, weight, sort_order, enabled, created_at`. `weight` drives spin probability (relative, not normalized to 100). Separate prize sets per `user_type` (`client` vs `merchant`). See §6 for the exact current WoowPay list — **Tpay will need its own prize list with its own copy/weights**, this is one of the "small configurations" to do after structural duplication.

### `funnel_events`
Lightweight analytics: `id, code, event_type ('code_valid'|'phone_verified'|'share_clicked'), user_type, created_at`.

### `bot_config`
Key-value store for secrets/config the edge function reads at runtime: `messenger_verify_token`, `page_access_token`. **Never fetch/display the raw `page_access_token` value** — Anthropic's own safety classifier blocks reading raw secrets like this, and correctly so; test token validity indirectly (e.g. a server-side `http_post` call from Postgres) instead of ever displaying it.

### `bot_nodes`
The entire Messenger bot conversation tree, data-driven (no hardcoded menu text in the edge function). Columns: `key (PK), text, quick_replies (jsonb), buttons (jsonb), template_type ('text'|'button'|'list'|'generic'), list_items (jsonb), cards (jsonb), updated_at`.
- `quick_replies`: `[{ "title", "target": "<node_key>" }]`
- `cards` (for `template_type = 'generic'`): `[{ "title", "subtitle", "image_url", "buttons": [{ "type": "web_url"|"phone_number"|"postback", "title", "url"/"payload" }] }]`
- Full current WoowPay node tree is reproduced in §7.

### `bot_debug_log`
Write-only error log for failed Graph API sends: `id, created_at, status_code, error_body, payload`.

### `bot_sessions`
Per-Messenger-user (PSID) state: `psid (PK), unrecognized_streak, in_handoff, last_handoff_at, updated_at`. See §8 for the handoff logic this drives.

---

## 4. Stored procedures (SECURITY DEFINER RPCs)

### `record_spin(p_code text, p_prize_label text default null) returns boolean`
Called by the web app after a spin resolves client-side, to persist the result server-side.
- Auto-detects "bonus spin" prizes: any label starting with `Хүрд эргүүлэх` containing a `+N` anywhere in the string (regex `\+(\d+)`) grants N extra spins. **This match was previously a rigid word-order pattern (`эргүүлэх +...эрх`) and silently failed for a differently-worded label variant — cost real bonus spins for ~53 clients before being caught and backfixed. For Tpay, keep the loose prefix+regex match, don't tighten it.**
- Auto-fulfills (sets `fulfilled = true` immediately, no manual "Олгосон" click needed) for: `Дараа дахин%` (no-prize consolation), `Хүрд эргүүлэх%` (bonus spins), `%сугалааны эрх%` (raffle entries) — these require no physical/manual handout.
- Atomic guard against double-spins: `spins_used < spins AND (last_spin_at IS NULL OR last_spin_at < now() - interval '2 seconds')`, combined with the `UPDATE ... RETURNING id` pattern so the insert into `spin_results` only happens if the update actually matched a row.

### `verify_phone_match(p_code text, p_phone text) returns boolean`
Called by the web app during phone verification (code known, phone typed by user).
- Returns `false` if the code doesn't exist / is disabled / deleted (**this was previously a bug**: falling through to "no phone on file → true" let ANY made-up-but-correctly-formatted code + any phone number through with zero admin record — fixed by returning false immediately on `not found`).
- Returns `true` if the code exists but has no phone on file (no constraint registered).
- Otherwise strict equality against the stored phone.

---

## 5. Web app (`src/`)

Key files (Vite/TypeScript, no framework):
- `src/data/codeValidator.ts` — pure format validation (`/^W[MC]-[A-Z0-9]{6}$/`), no network calls.
- `src/data/records.ts` — static fallback registry (`CODE_RECORDS`), only used when Supabase is unreachable/unconfigured. Not the source of truth once Supabase is live.
- `src/data/clientService.ts` — the real logic:
  - `validateCodeRemote(code)`: format-check locally first, then `SELECT id,code,spins,spins_used,enabled,user_type FROM clients WHERE code=... AND enabled=true`. **A miss here must return `{valid:false}`, never fall back to the static registry** — falling back is exactly what let fake codes through before the fix.
  - `verifyPhoneRemote(code, phone)`: calls the `verify_phone_match` RPC, falls back to static `verifyPhone()` only on network error.
  - `recordSpin(code, prizeLabel)`: fire-and-forget call to the `record_spin` RPC.
- `src/components/CodeEntry.ts` — the two-step UI (code entry → phone verification). Reads `?code=` from the URL for the Messenger-bot deep-link flow, auto-submits it. Headline copy: `"Хүрдээ эргүүлээд азтан болоорой!"` (`.ce-title`, must NOT have `white-space: nowrap` — that broke wrapping when the headline got longer).
- `index.html` — OG meta tags for link previews: `og:image` 1200×630, `https://loyalty.woowpay.mn/og-cover.png`.
- App-store deep link used throughout (signoff footer, Messenger "Апп татах" cards): OneLink `https://onelink.to/4z2e53`. For Tpay this needs Tpay's own OneLink/app-store links, or should be omitted if Tpay has no app.

---

## 6. Current WoowPay prize list (client-type wheel)

For reference only — Tpay needs its own copy/odds, but this shows the *pattern* (mix of instant-gratification "try again", points, credit boosts, bonus spins, raffle entries, and rare big prizes):

| Label | Weight | Emoji |
|---|---|---|
| Дараа дахин оролдоно уу, Баярлалаа 💙 | 7 | 🍀 |
| 5,000 WooW Бонус оноо | 2 | ⭐ |
| 10,000 WooW Бонус оноо | 1.7 | ⭐ |
| 20,000 Woow Бонус оноо | 1 | ⭐ |
| Худалдан авалтын зээлийн эрх +10,000₮ | 0.6 | 🛍️ |
| Худалдан авалтын зээлийн эрх +20,000₮ | 0.4 | 🛍️ |
| Бэлэн мөнгөний зээлийн эрх +10,000₮ | 0.6 | 💵 |
| Бэлэн мөнгөний зээлийн эрх +20,000₮ | 0.4 | 💵 |
| Хүрд эргүүлэх нэмэлт эрх +1 | 1.8 | 🎡 |
| Хүрд эргүүлэх нэмэлт эрх +2 | 0.9 | 🎡 |
| Супер сугалааны эрх +1 | 1.5 | 🎟️ |
| Супер сугалааны эрх +2 | 0.8 | 🎟️ |
| Ваучер 50,000₮ | 0.1 | 🎁 |
| Ваучер 20,000₮ | 0.5 | 🎁 |
| Бэлэн мөнгө 500,000₮ | 0 (disabled effectively) | 🎁 |

Merchant-type list follows the same shape with merchant-specific prizes (signage, fridge, fee discounts, etc.) — see `prizes` table, `user_type = 'merchant'`.

**Important naming convention to preserve for Tpay:** any label meant to auto-grant bonus spins must start with the literal phrase that `record_spin`'s `ilike 'Хүрд эргүүлэх%'` check matches (translate this prefix into Tpay's own language/wording, and update the RPC's `ilike` pattern to match) — and must contain a `+N` somewhere in the string. Same for `%сугалааны эрх%` (raffle) and `Дараа дахин%` (no-prize) if keeping the raffle/consolation concepts.

---

## 7. Messenger bot — full `bot_nodes` tree (WoowPay)

The bot is entirely data-driven off this table — **duplicate the table structure exactly, then replace every node's Mongolian copy/targets with Tpay equivalents.** Node graph (key → what it does):

- `welcome` — shown ONLY on first "Get Started" tap (full greeting + main menu cards: Харилцагч / Мерчант / WooW оноо & Урамшуулал / WooW Зөвлөх). Quick reply: Ажилтантай холбогдох.
- `root` — same main menu, shown on every other "home" navigation, but with **no greeting text** (empty `text` field) — this split exists specifically so returning users don't see the intro paragraph every time.
- `client` — client sub-menu (loan terms, loan management, purchase guide, app/register, loyalty, help).
- `client_app`, `client_app_register`, `client_guide_extend`, `client_guide_pay`, `client_guide_purchase`, `client_guide_register`, `client_loan_cash`, `client_loan_manage`, `client_loan_purchase`, `client_loan_terms` — informational leaf/branch nodes, mostly `button` or `generic` template with a link to `onelink.to/4z2e53` for app download or a video guide.
- `merchant`, `merchant_criteria`, `merchant_find_guide`, `merchant_new`, `merchant_new_benefits`, `merchant_new_guide`, `merchant_sales_guide`, `merchant_settlement` — merchant-side equivalent tree, links to `merchant.woowpay.mn`.
- `loyalty` — the loyalty sub-menu: Урамшууллын хүрд (→ `wheel`), WooW оноо (→ `loyalty_points`), Супер сугалаа (→ `loyalty_lottery`).
- `wheel` — **the important one**: `"Урамшууллын хүрд 🎁 эргүүлэх кодоо авахын тулд бүртгэлтэй утасны дугаараа доор бичнэ үү. 📱💙"** — prompts for phone number. The actual code delivery happens in code (`sendWheelResult`, §8), not via this static node — this node is just the prompt card.
- `loyalty_points`, `loyalty_lottery` — "coming soon" placeholders.
- `contact_choice` — "Утсаар холбогдох" / "Чатаар холбогдох" / Нүүр цэс.
- `contact` — phone numbers (button template).
- `chat` — "leave a message, staff will reply" text, only reachable via `contact_choice`.

**Quick-reply pattern:** almost every leaf node ends with `Ажилтантай холбогдох` (→ `contact_choice`) then `🏠 Нүүр цэс` (→ `root`), in that order, with `🎡 Урамшууллын хүрд` (→ `wheel`) inserted between them on ~22 of the nodes (added later, see §10) so the wheel is always one tap away regardless of what info screen the client is on.

For Tpay: recreate this exact node graph with Tpay's own products/copy substituted in place of loan/merchant content (or a simpler tree if Tpay's business model differs) — but the **`wheel` node + `sendWheelResult` phone-number-driven code delivery flow should be duplicated as-is**, that's the loyalty mechanic being replicated.

---

## 8. Messenger bot — edge function logic (`messenger-webhook`, current version 23)

Deno edge function, `verify_jwt: false` (Meta's webhook can't send a Supabase JWT). Key behaviors to preserve exactly:

**Webhook verification (GET):** standard Meta challenge-response using `messenger_verify_token` from `bot_config`.

**Event handling (POST):**
1. Quick-reply / postback taps always reset `unrecognized_streak` to 0 and `in_handoff` to false (explicit "I want the bot" signal), then route to the target node via `sendNode`. `GET_STARTED` postback specifically routes to `welcome` (not `root`) for the one-time greeting.
2. Free-text messages: if the text, stripped to digits, is 6–12 characters long, it's treated as a phone number → `sendWheelResult(psid, digits, pageToken)`.
3. Otherwise it's an "unrecognized" message:
   - First unrecognized message in a streak: `"Уучлаарай, ойлгосонгүй 🙏\n\nТаны асуулт доорх сонголтод байхгүй бол санаа зоволтгүй. 💬 \nДахин нэг удаа дурын текст бичээд, харилцагчийн зөвлөхтэй холбогдоорой."` + resend `root` menu, streak → 1.
   - Second consecutive unrecognized message: hands off to human — `"Таны хүсэлтийг харилцагчийн зөвлөх рүү шилжүүллээ. 🎧\nУдахгүй эргэн холбогдох хүртэл түр хүлээхийг хүсье, баярлалаа."` with only a `🏠 Нүүр цэс` quick reply (deliberately no phone-contact option — a client already in a live handoff chat is waiting for the human, not being redirected elsewhere), sets `in_handoff = true`.

**Handoff silence + 6-hour auto-expiry (`HANDOFF_TIMEOUT_MS`):** once `in_handoff` is true, the bot goes completely silent for that user (`continue` on every incoming message) so it doesn't talk over a human agent. Two ways out: (a) the user taps any quick reply/postback (immediate), or (b) 6 hours elapse since `last_handoff_at` (safety net so a client isn't permanently excluded if staff resolve their case in native Messenger without ever touching this codebase). **This was a real production incident** — before the timeout existed, clients who got handed off stayed silently excluded from the bot forever.

**`sendWheelResult(psid, phone, pageToken)`** — the actual code-delivery flow:
1. Looks up `clients` by exact `phone` match (`enabled=true, deleted_at is null`, newest match if duplicates exist).
2. If not found: sends the "no rights yet" message (exact current text, §9) with `Ажилтантай холбогдох` + `🏠 Нүүр цэс` quick replies.
3. If found: computes `spinsLeft = spins - spins_used`, sums raffle entries from `spin_results` (`ilike '%сугалааны эрх%'`, regex-summed `+N`), sends the code as **its own separate plain-text message bubble** (preceded by a "🔑 Таны код:" label message) so it's trivially copyable, then a button-template message showing spin count + raffle count with a "Хүрдээ эргүүлэх" button linking to `${SITE_URL}/?code=${code}`.

**Secrets:** `page_access_token` and `messenger_verify_token` read from `bot_config` table at request time — never hardcode, never log/print the raw value.

---

## 9. Current exact bot copy (verbatim, for Tpay to adapt)

"No rights yet" message (shown when a phone number isn't found in `clients`):
```
Танд одоогоор Урамшууллын хүрд эргүүлэх эрх олгогдоогүй байна. 🔍
Та дугаараа зөв бичсэн эсэхээ дахин шалгаарай.

WoowPay фб хуудсыг дагаж, Шинэ боломж, Шинэ урамшууллуудын мэдээллийг хамгийн түрүүнд аваарай. 💙
https://www.facebook.com/woowpay
```

First-unrecognized-message text:
```
Уучлаарай, ойлгосонгүй 🙏

Таны асуулт доорх сонголтод байхгүй бол санаа зоволтгүй. 💬 
Дахин нэг удаа дурын текст бичээд, харилцагчийн зөвлөхтэй холбогдоорой.
```

Handoff-to-human text:
```
Таны хүсэлтийг харилцагчийн зөвлөх рүү шилжүүллээ. 🎧
Удахгүй эргэн холбогдох хүртэл түр хүлээхийг хүсье, баярлалаа.
```

Welcome greeting (`welcome` node, first Get Started only):
```
Сайн байна уу?
WoowPay танд юугаар туслах вэ? 💙

Та хэрвээ Урамшууллын хүрд 🎁 эрхээ авах гэж байгаа бол чатны аль ч хэсэгт утасны дугаараа бичихэд л хангалттай.
```

Wheel prompt (`wheel` node):
```
Урамшууллын хүрд 🎁 эргүүлэх кодоо авахын тулд бүртгэлтэй утасны дугаараа доор бичнэ үү. 📱💙
```

Code delivery button-template text (after phone lookup succeeds):
```
Урамшууллын хүрд эргүүлэх эрх: ${spinsLeft}
Супер сугалааны эрх: ${raffleTotal}ш

Доорх товч дээр дараад шууд хүрдээ эргүүлээрэй! 🎁✨
```

All of the above needs Tpay-brand rewording (product name, page link, tone) but the **structure/logic driving each message should be duplicated exactly**.

---

## 10. Admin panel (`public/admin.html`) — features and hard-won fixes

Single self-contained HTML file, Supabase-auth login gate (only `admin@woowpay.mn` per the RLS policy — **must be changed to Tpay's admin email in both the RLS policy and this file's expectations**), three tabs: Харилцагчид (clients), Шагнал ба магадлал (prizes/odds), Супер сугалаа (raffle entries).

**Critical, non-obvious bugs already fixed — replicate the fixes, not the original bugs:**

1. **PostgREST 1000-row cap.** Any plain `.select()` without `.range()` silently truncates at 1000 rows once a table crosses that size. Fixed via a shared `fetchAllRows(table, selectStr, build)` helper that pages through in chunks of 1000 and concatenates. Used everywhere a full table needs loading (client list, spin_results, raffle tab, CSV-import dedup check).

2. **Non-deterministic pagination with tied timestamps.** Ordering by `created_at` alone is NOT sufficient for stable `.range()` pagination — bulk CSV imports insert hundreds/thousands of rows sharing the *exact same* timestamp (down to the microsecond), and Postgres doesn't guarantee stable order among ties across separate paginated queries. Result: a row can silently vanish from every page (replaced by a duplicate of some other tied row) while the *total count* still looks correct — extremely hard to notice until someone searches for a specific person and gets zero results despite the row existing in the database. **Fix: `fetchAllRows` always appends `.order('id', {ascending:true})` as a tiebreaker** after whatever primary order the caller requested. Do this from day one for Tpay, don't wait to rediscover it.

3. **CSV/XLSX import only deduped by code, not phone.** Since generated codes are random and therefore never collide, re-importing a list that overlaps a previous import (e.g. combining two days' batches into a master file) silently created a second, duplicate client account (new code, new free spin) for anyone whose phone appeared in more than one file. Fixed: `importRows()` now builds a `phone → existing client` map first; if a row's phone already belongs to a client (or repeats within the same file), the spin count is added to the existing client instead of inserting a new row. **Build this in from the start for Tpay**, don't let it accumulate duplicates first.

4. **Status filter (`Шагнал олгосон` / `Шагнал олгоогүй`) hid never-spun clients entirely.** The filter checked `prizes.some(...)` which is `false` on an empty array either way, so a client with zero spin history matched neither filter and silently disappeared from search results. Fixed: a client with no prize records counts as "Шагнал олгоогүй" (never received a prize is definitionally true for them).

5. **Stat cards (Нийт харилцагч / Идэвхтэй / Нийт эргэлт / Ашигласан эргэлт) were hardcoded to site-wide totals**, ignoring the active search/filter — confusing when you've filtered down to a specific segment but the header still shows everyone. Fixed: `updateStats()` now takes the currently-filtered client list as a parameter, called from inside `filterClients()`.

6. **`record_spin`'s bonus-spin/auto-fulfill matching was too rigid** (see §4/§6) — cost real spins silently. Use loose prefix + regex matching, not exact phrase matching, for any "this label means X" logic anywhere in the system.

**Features present (duplicate all of these):**
- Client CRUD: add/edit/enable-disable/soft-delete (trash)/restore/hard-delete, single and batch.
- CSV/XLSX import (header-name-matched columns, not fixed position: Нэр, Утас required; Код, Төрөл, Эргэлт/Эрхийн тоо, Идэвхтэй, Тэмдэглэл optional) and export.
- Prize/odds management (weight-based probability, per-user-type).
- Per-client spin/prize history modal, gift-icon quick-fulfill toggle.
- Раffle tab: aggregates `Супер сугалааны эрх +N` wins per client into a running tally (no raffle rules/draw date finalized yet — this is just an auditable running count so nothing is lost before the memo is ready), exportable.
- Rows-per-page selector (50/100/500).
- Date/time range filter on "Эргүүлсэн" (spin timestamp) — filters at the individual-spin level (not client level), so a client who spun both before and after a cutoff only shows the in-range spin(s). Useful for "who spun after we already handed out prizes at 9am" type questions. Stat cards follow this filter too.

---

## 11. General lessons for the new chat to internalize

- **Verify deployed Cyrillic text by reading it back** (`get_edge_function` after `deploy_edge_function`) — hand-typed `\u` escapes have silently corrupted a message once before (a stray CJK character appeared mid-word). Prefer literal UTF-8 text over manual escaping.
- **Never fetch/display raw secrets** (`page_access_token`, service role keys, etc.) — test their validity indirectly (e.g. a server-side `http_post` from Postgres) instead.
- Sandbox `curl` to `*.supabase.co` is blocked by network allowlist — use Postgres's `http` extension for server-side test requests instead of trying to bypass the sandbox.
- The sandbox has no GitHub push credentials — every code change ships via git commands given to the user to run in their own terminal. Vercel auto-deploys on push to `main`; deployment status can be checked via the Vercel MCP tools (`list_deployments`) rather than assumed.
- Any "label X means behavior Y" pattern-matching logic (bonus spins, auto-fulfillment, raffle detection) should match loosely (prefix + regex) rather than an exact rigid phrase — copy wording drifts over time (e.g. "Хүрд эргүүлэх +1 эрх" → "Хүрд эргүүлэх нэмэлт эрх +1") and a rigid match silently breaks real functionality with no error, only discovered when a client complains.
- When in doubt about a data discrepancy (missing records, wrong counts), verify directly against the database with SQL before assuming the report is accurate — several "missing data" reports in this project turned out to be admin-panel display bugs (pagination, filters) with the underlying data fully intact. Always cross-check the *specific* records a user names, not just aggregate counts, since counts can coincidentally still match even when specific rows are wrong (see bug #2 above).
