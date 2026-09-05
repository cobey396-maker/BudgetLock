# BudgetLock

A spending-limit budgeting app. Set a monthly (or weekly) limit, split it across
categories, connect a bank via Plaid, and watch a car-speedometer gauge track your
spend against the redline.

Installable as a PWA: open it on a phone and **Add to Home Screen** for a
full-screen app with an offline shell.

## Stack

- **Next.js 15 (App Router) + TypeScript** — mobile-first PWA frontend **and** the
  Node/TypeScript backend (API routes) in one deployable.
- **Prisma + Postgres** — real relational DB, schema managed with migrations.
- **Plaid SDK** — real Link-token / public-token exchange / `/transactions/sync`
  cursor ingestion, with a built-in **mock fallback** (same Plaid transaction
  shape) when credentials are absent, so the flow runs anywhere in development.
- **Auth** — email/password with bcrypt hashing and DB-backed session cookies.

## Running locally

```bash
npm install
cp .env.example .env          # fill in the two POSTGRES_* vars and AUTH_SECRET
npm run db:migrate            # applies prisma/migrations to your database
npm run dev                   # http://localhost:3200
```

You need a Postgres to point at. Either run one locally
(`docker run -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres`, then set both
`POSTGRES_*` vars to `postgresql://postgres:pw@localhost:5432/postgres`), or copy
the connection strings out of your hosted database.

Leave `PLAID_CLIENT_ID` / `PLAID_SECRET` blank and "Connect a bank" uses the
built-in mock importer, so the whole app works without Plaid credentials.

### Checks

```bash
npm run check      # lint + typecheck + tests
npm run lint
npm run typecheck
npm test
npm run icons      # regenerate PWA icons + the OG card from public/icon.svg
```

## Deploying

See **[DEPLOY.md](DEPLOY.md)** for the Vercel walkthrough and
**[LAUNCH.md](LAUNCH.md)** for the pre-launch checklist.

`npm run build` runs `scripts/db-deploy.mjs`, which applies pending migrations
(baselining automatically if the database was originally created with
`prisma db push`) and then builds Next.js.

> BudgetLock must be served over HTTPS in production. The session cookie uses the
> `__Host-` prefix and the `Secure` attribute, which browsers reject over plain
> HTTP on any host other than `localhost`.

## Environment

| var | required | purpose |
|-----|----------|---------|
| `POSTGRES_PRISMA_URL` | yes | pooled Postgres connection used at runtime |
| `POSTGRES_URL_NON_POOLING` | yes | direct connection used for migrations |
| `AUTH_SECRET` | yes | session secret + key for encrypting Plaid tokens (`openssl rand -hex 32`) |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | no | Plaid credentials — blank uses the mock importer |
| `PLAID_ENV` | no | `sandbox` (default) or `production` |
| `NEXT_PUBLIC_APP_URL` | no | canonical origin for metadata/sitemap; inferred on Vercel |
| `NEXT_PUBLIC_OPERATOR_NAME` | no | shown on the legal pages |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | contact address on the legal pages |
| `NEXT_PUBLIC_GOVERNING_LAW` | no | jurisdiction named in the terms |
| `NEXT_PUBLIC_LEGAL_UPDATED` | no | "last updated" date on the legal pages |

Configuration is validated at server start (`src/instrumentation.ts`). Only a
missing `POSTGRES_PRISMA_URL` stops the server — without it no request can be
served anyway. Every other problem is logged as a warning and reported by
`/api/health` while the app keeps serving, so a half-configured optional
integration can never cause an outage.

## Architecture

- `src/lib/` — shared domain logic
  - `categories.ts` — the 5 budget categories + Plaid category mapping, plus seed txns.
  - `budget.ts` — money formatting, suggested-limit formula, per-period spend
    **aggregation** (gauge/bars/status), and gauge SVG geometry.
  - `state.ts` — builds the full per-user state snapshot (incl. server-side summary).
  - `env.ts` — typed environment access and startup validation.
  - `crypto.ts` — AES-256-GCM encryption for stored Plaid access tokens.
  - `rateLimit.ts` — Postgres-backed fixed-window rate limiting.
  - `auth.ts`, `db.ts`, `plaid.ts`, `plaidSync.ts`, `http.ts`, `client.ts`.
- `src/app/api/` — auth, account, profile, budget, transactions, plaid, health, demo/reset.
- `src/app/privacy`, `src/app/terms` — legal pages (see the warning in `src/lib/legal.ts`).
- `src/components/` — one client state machine (`App.tsx`) mirroring the app's
  phases (account → questionnaire → onboarding → main app) plus screens and overlays.

State persists **server-side per user**; the server component (`app/page.tsx`)
resolves the session and hands the client its full state, so a reload restores the
user exactly where they left off.

## Security posture

- Passwords: bcrypt, cost 12, 8-character minimum, 72-byte cap.
- Sessions: 32 random bytes, stored as a SHA-256 digest so a database leak cannot
  be replayed; `__Host-` prefixed, `HttpOnly`, `SameSite=Lax`, 30-day expiry.
- Plaid access tokens: AES-256-GCM at rest, key derived from `AUTH_SECRET` by HKDF.
- Rate limits: per-account and per-IP on login, per-IP on signup, per-user on
  writes and Plaid calls — enforced in Postgres so they hold across serverless
  instances.
- Login does a constant-time-equivalent comparison against a dummy hash for
  unknown emails, so the endpoint cannot be used to enumerate accounts.
- Response headers: CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`; `no-store` on every `/api` response.
- No third-party scripts, fonts, trackers or analytics. Fonts are self-hosted.

## Behaviour notes

- The "lock ring" is a **car speedometer gauge** (240° sweep, needle, tick marks,
  red redline zone). The metaphor is driving throughout (CRUISING / REDLINE AHEAD /
  OVER REDLINE, "Start driving", "Gauge" tab).
- **5 categories** (Groceries .30, Food & Drink .25, Gas & Rides .20,
  Entertainment .15, Subscriptions .10).
- Warn threshold is **0.8**, centralized in `tokens.ts`.
- Period (Weekly/Monthly) lives in **Settings** as a segmented toggle; weekly = monthly ÷ 4.
- Period windows use the **local** calendar month/week, not UTC.
- Bonus features: manual "Log a purchase", CSV import, and the transaction-detail sheet.
