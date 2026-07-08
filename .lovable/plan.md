## Migrate the app off Lovable Cloud onto your Neon Postgres

This replaces the managed backend (auth + database) with your own Neon database and a hand-rolled auth system. pgAdmin is a separate desktop tool you'll use to browse/edit the Neon DB — it's not something the app connects "through".

### 1. Store the connection string as a secret
- Save the Neon URL as `DATABASE_URL` (server-only secret, never in code).
- Generate a `SESSION_SECRET` for signing JWT session tokens.

### 2. Recreate the schema on Neon
Run a bootstrap SQL script (via a one-time server route or manually in pgAdmin) that creates:
- `users` (id, email UNIQUE, password_hash, full_name, created_at)
- `user_roles` (user_id, role) with a `role` enum: `admin | manager | compliance_officer | agronomist`
- `farmers`, `batches`, `inspections`, `incidents` — same columns as today
- Indexes on foreign keys and common filters (region, batch_date, status)

Since Neon is plain Postgres, there is **no RLS enforced per user** — all access control moves into server-side code.

### 3. New server layer (`createServerFn`)
Create one Postgres pool (`src/lib/db.server.ts`) using `pg` with `DATABASE_URL` + SSL. Add server functions grouped by domain:
- `auth.functions.ts` — `signUp`, `signIn`, `signOut`, `getCurrentUser` (bcrypt + JWT in httpOnly cookie)
- `farmers.functions.ts`, `batches.functions.ts`, `inspections.functions.ts`, `incidents.functions.ts` — list / create / update / delete, each verifying the session cookie and role
- `admin.functions.ts` — list users, change roles

Every mutation the UI performs will hit one of these; edits WILL land in Neon and be visible in pgAdmin immediately.

### 4. Rewrite the frontend
Rip out `@supabase/supabase-js` usage:
- Replace `supabase.auth.*` in `auth.tsx` with calls to the new `signIn` / `signUp` server functions
- Replace every `supabase.from(...).select()` in `farmers.tsx`, `batches.tsx`, `inspections.tsx`, `incidents.tsx`, `dashboard.tsx`, `reports.tsx`, `admin.tsx`, `AppShell.tsx` with the matching server function via `useServerFn` + TanStack Query
- Replace the `_authenticated` guard with a check against the new `getCurrentUser` server fn

### 5. Seed data
Optional seed script that inserts the demo farmers/batches/inspections into Neon so the dashboard isn't empty on first run.

### 6. Connecting pgAdmin
I'll give you the host/port/user/password broken out of the URL so you can paste them into pgAdmin's "Register Server" dialog. Any change you make in the app writes to Neon; refresh a table in pgAdmin to see it.

### Technical notes
- Packages to add: `pg`, `@types/pg`, `bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`, `zod` (already present).
- All DB access goes through `*.server.ts` or `.handler()` bodies — Neon credentials never ship to the browser.
- Session = signed JWT in an httpOnly, secure, sameSite=Lax cookie; read via `getCookie` from `@tanstack/react-start/server`.
- The existing Lovable Cloud tables stay untouched (we just stop reading from them). If you later want to disable Cloud entirely, that's a workspace-level setting.

### What you lose vs today
- Supabase Auth features (email verification, password reset emails, OAuth providers) — none of this exists in Neon; you'd need an email provider (Resend) to add them back later.
- RLS: gone. All access control is now enforced in server functions. Bugs there = data exposure, so I'll be strict about role checks.

### Rough size
~15 files created, ~10 files rewritten. I'll do it in one pass and verify sign-in + a data read/write end-to-end before handing back.

Approve and I'll start with step 1 (secrets) and step 2 (schema bootstrap).
