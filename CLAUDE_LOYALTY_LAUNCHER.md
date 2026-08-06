# 🚀 loyalty.woowpay.mn — Claude Chat Launcher

> Paste this entire file at the start of the new Claude chat to give it full context.

---

## What This Project Is

**WoowPay Loyalty** is a spin-wheel loyalty platform for WoowPay merchants.
Clients get a unique code, visit `loyalty.woowpay.mn`, enter their code + phone number, and spin a prize wheel.
Admins manage clients (CRUD, CSV import/export, spin tracking) at `loyalty.woowpay.mn/admin`.

---

## 🌐 Live URLs

| Purpose | URL |
|---|---|
| Spin wheel (user-facing) | https://loyalty.woowpay.mn |
| Admin panel | https://loyalty.woowpay.mn/admin (needs push — see Pending Tasks) |
| Admin panel (direct) | https://loyalty.woowpay.mn/admin.html ✅ works now |

---

## 📁 File & Folder Locations

**Local workspace folder:**
```
/Users/duke/Desktop/Claude/Woow/WoowPayLoyalty/
```

**Key files:**
```
WoowPayLoyalty/
├── public/
│   ├── admin.html              ← Admin panel (deployed to Vercel)
│   ├── logo-navy.png
│   ├── logo-white.png
│   ├── og-cover.png
│   ├── owl-phone.png
│   ├── owl-pointing.png
│   └── owl-thumbsup.png
├── src/
│   ├── main.ts                 ← App entry point
│   ├── router.ts               ← Page routing
│   ├── state.ts                ← Global state
│   ├── audio.ts                ← Sound effects
│   ├── types.ts                ← TypeScript types
│   ├── components/
│   │   ├── CodeEntry.ts        ← Code + phone validation (async, Supabase-aware)
│   │   ├── SpinWheel.ts        ← Spin wheel canvas
│   │   ├── SpinScreen.ts       ← Spin UI + recordSpin() call
│   │   └── ResultModal.ts      ← Win/lose modal + share card
│   ├── data/
│   │   ├── records.ts          ← Static fallback client codes
│   │   ├── prizes.ts           ← Prize definitions + probabilities
│   │   ├── codeValidator.ts    ← Code format validation (WM-XXXXXX)
│   │   └── clientService.ts    ← Supabase async validation + recordSpin
│   ├── lib/
│   │   └── supabase.ts         ← Raw fetch-based Supabase REST helper
│   └── styles/
│       └── main.css
├── supabase-schema.sql         ← Full DB schema (already applied)
├── woowpay-admin.html          ← Backup copy of admin panel
├── vercel.json                 ← cleanUrls: true (needs git push)
├── .env                        ← Supabase env vars (for local dev)
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔧 Tech Stack

| Layer | Tool |
|---|---|
| Frontend framework | Vanilla TypeScript + Vite |
| Spin wheel | Canvas API |
| Database | Supabase (PostgreSQL + REST API) |
| Auth (admin) | Supabase Auth |
| Hosting | Vercel |
| Admin panel | Standalone HTML (no build needed) |
| CSS | Custom CSS variables, dark navy theme |

**No npm packages for Supabase** — uses raw `fetch` against Supabase REST API.
Admin panel uses `@supabase/supabase-js@2` from jsDelivr CDN.

---

## ☁️ Vercel

- **Project name:** `woow-pay-loyalty-web`
- **Vercel dashboard:** https://vercel.com/dukertes-projects/woow-pay-loyalty-web
- **GitHub repo:** https://github.com/Dukerte/WoowPay-loyalty-web
- **Branch deployed:** `main`
- **Build command:** `npm run build` (runs `tsc && vite build`)
- **Output dir:** `dist/`
- **Public static files:** `public/` → served at site root

**Environment Variables in Vercel** (must be set under Project → Settings → Environment Variables):
```
VITE_SUPABASE_URL    = https://jamlxsllyqscxydkkwhe.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbWx4c2xseXFzY3h5ZGtrd2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjY2MzEsImV4cCI6MjEwMTU0MjYzMX0.NwJ9IUfSIhpgMivFt517V2h4uD7mCyJWLxoPpYJ2_w4
```

---

## 🗄️ Supabase

- **Project ref:** `jamlxsllyqscxydkkwhe`
- **Dashboard:** https://supabase.com/dashboard/project/jamlxsllyqscxydkkwhe
- **Project URL:** `https://jamlxsllyqscxydkkwhe.supabase.co`
- **Anon/public key:**
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbWx4c2xseXFzY3h5ZGtrd2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjY2MzEsImV4cCI6MjEwMTU0MjYzMX0.NwJ9IUfSIhpgMivFt517V2h4uD7mCyJWLxoPpYJ2_w4
  ```

### Database Schema (`public.clients` table)

```sql
create table public.clients (
  id           uuid        default gen_random_uuid() primary key,
  name         text        not null,
  phone        text        not null,
  code         text        unique not null,       -- format: WM-XXXXXX
  user_type    text        not null default 'client'
                           check (user_type in ('merchant', 'client')),
  spins        integer     not null default 1,    -- total spins allowed
  spins_used   integer     not null default 0,    -- spins consumed
  enabled      boolean     not null default true,
  last_spin_at timestamptz,
  created_at   timestamptz default now(),
  notes        text
);
```

### RLS Policies
- **Anon:** SELECT only `enabled = true` rows
- **Authenticated:** Full CRUD

### Key Function
```sql
-- Called by spin wheel (anon) to record a spin without full write access
create function public.record_spin(p_code text) returns void
  language plpgsql security definer ...
grant execute on function public.record_spin(text) to anon;
```

---

## 🔐 Admin Panel Credentials

**URL:** https://loyalty.woowpay.mn/admin.html

| Field | Value |
|---|---|
| Email | enkhdulguun.amarbayasgalan@gmail.com |
| Password | (stored in password manager — not in this file) |

> ⚠️ The password used to live here in plaintext. Since this file gets pasted into chat
> contexts, treat that old password as burned — rotate it in Supabase Auth
> (Dashboard → Authentication → Users → reset password) and keep the new one
> out of any doc that leaves your machine.
> Admin user was created in Supabase Auth dashboard. Supabase credentials are hardcoded as defaults in `public/admin.html` so the panel works on Vercel without config.

---

## 🎰 Test Spin Credentials (Static Fallback Codes)

These codes exist in `src/data/records.ts` as static fallback (work even if Supabase is down):

| Code | Phone | Notes |
|---|---|---|
| WM-TEST01 | (any) | Test code — phone not required |

> To add real clients: log into the admin panel → Add Client button.
> Format: code must be `WM-` followed by 6 alphanumeric characters (e.g. `WM-ABC123`).

---

## ⚠️ Pending Tasks (as of 2026-08-06)

### ✅ Already done (this doc previously said these were pending — they weren't)
- Git push of the `sbClient` fix + `vercel.json` — confirmed pushed (`f66f829`, branch up to date with `origin/main`).
- `/admin` clean URL — confirmed live, redirects correctly to `/admin`.

### 🔲 Still open
1. **Run the security migration in Supabase** — see `supabase-schema.sql`, the "MIGRATION" block near the bottom (dated 2026-08-06). It fixes an unbounded `record_spin()` call (spins could be incremented past the client's limit by calling the API directly) and an overly broad admin RLS policy (any authenticated Supabase user, not just the admin, had full CRUD). Paste that block into Supabase → SQL Editor → Run.
2. **Rotate the admin password** — it was stored in plaintext in this file for a while. Reset it in Supabase Auth and keep the new one out of any doc that gets pasted into chats.
3. **Disable public sign-ups in Supabase Auth** (Dashboard → Authentication → Providers → Email → turn off "Allow new users to sign up") — otherwise the RLS fix in #1 still leaves the door open to anyone who can register a new account before that setting is off.
4. **Add Vercel Environment Variables** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project → Settings → Environment Variables, then redeploy, so the spin wheel validates against the live DB instead of only static fallback records.
5. **Verify admin login end-to-end** after the above.
6. **`.env` was committed to git history** — now untracked and gitignored going forward, but it still exists in old commits. Since it's the anon key (expected to be public-ish given RLS), low urgency, but confirm the GitHub repo is private, or scrub history if you want it fully gone.

---

## 🧩 How the Code Validation Flow Works

```
User enters code + phone
        ↓
CodeEntry.ts → clientService.validateCodeRemote()
        ↓
Supabase REST: GET /rest/v1/clients?code=eq.WM-XXXXX&enabled=eq.true
        ↓
If found → verifyPhoneRemote() checks phone matches DB
If Supabase fails → falls back to static records.ts data
        ↓
On spin win → SpinScreen.ts calls recordSpin(code)
        ↓
Supabase RPC: POST /rest/v1/rpc/record_spin { p_code: "WM-XXXXX" }
(increments spins_used, sets last_spin_at)
```

---

## 🐛 Known Issues / History

- **`supabase` variable conflict** — CDN lib declares `window.supabase`; our script had `let supabase = null` which clashed. Fixed by renaming to `sbClient`. **Fix is in files but needs git push.**
- **`/admin` returns 404** — `vercel.json` with `cleanUrls: true` fixes this. **Needs git push.**
- **`.git/index.lock` exists** — Sandbox can't delete it. Must `rm -f .git/index.lock` from user's Terminal before committing.
- **localStorage blocked on file://** — Admin panel has hardcoded Supabase defaults so it works both locally (file://) and on Vercel.

---

## 💡 Recommended Claude Model for This Chat

**Use Claude Sonnet** (`claude-sonnet-5` or latest Sonnet).

- This project involves full-stack web dev (TypeScript, Vite, Supabase REST, Vercel, HTML/CSS)
- Sonnet has the right balance of speed and capability for coding tasks
- Opus is more powerful but slower — only needed for complex architecture decisions
- Haiku is too limited for multi-file TypeScript debugging

---

## 📋 What's Done vs What's Left

### ✅ Completed
- Vite + TypeScript project scaffolded
- 6-digit code format (WM-XXXXXX)
- Phone number display in spin header
- Spin wheel audio effects
- Social media share card on win
- Prize list with probabilities (Excel + code)
- Supabase schema created and deployed
- Supabase async validation in CodeEntry.ts
- Spin tracking via `record_spin` RPC
- Admin panel HTML built with full CRUD, CSV import/export, stats
- Admin panel deployed to Vercel at `/admin.html`
- Admin user created in Supabase Auth
- JS bug fix (`sbClient` rename) applied to files

### 🔲 Still Needed
- Git push (fix + vercel.json)
- Vercel env vars (so spin wheel uses Supabase DB)
- Verify admin login end-to-end
- Add real client records via admin panel
- (Optional) Merchant portal / multi-tenant support
- (Optional) Spin limit enforcement (block if spins_used >= spins)
