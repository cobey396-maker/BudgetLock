# BudgetLock

A spending-limit budgeting app built from the `design_handoff_budgetlock` prototype.
Set a monthly (or weekly) limit, split it across categories, connect a bank via
Plaid, and watch a car-speedometer gauge track your spend against the redline.

## Stack

- **Next.js 15 (App Router) + TypeScript** — mobile-first PWA frontend **and** the
  Node/TypeScript backend (API routes) in one deployable.
- **Prisma + SQLite** — real relational DB. Swap `provider`/`DATABASE_URL` in
  `prisma/schema.prisma` + `.env` to `postgresql` for production.
- **Plaid SDK (sandbox)** — real Link-token / public-token exchange /
  `/transactions/sync` cursor ingestion, with a built-in **mock fallback** (same
  Plaid transaction shape) when sandbox creds are absent, so the flow runs anywhere.
- **Auth** — email/password with bcrypt hashing and DB-backed session cookies.

## Running

```bash
npm install
npx prisma migrate dev      # creates dev.db
npm run dev                 # http://localhost:3200
```

Production:

```bash
npm run build && npm start
```

## Environment (`.env`)

| var | purpose |
|-----|---------|
| `DATABASE_URL` | Prisma DB URL (`file:./dev.db` by default) |
| `AUTH_SECRET` | session secret (rotate in production) |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | Plaid **sandbox** creds — leave blank to use the mock importer |
| `PLAID_ENV` | `sandbox` (default) |

With Plaid creds set, "Connect a bank" runs the real sandbox path
(`/sandbox/public_token/create` → `itemPublicTokenExchange` → `transactionsSync`).
Without them it stores a stub item and ingests mock transactions of the same shape.

## Architecture

- `src/lib/` — shared domain logic
  - `categories.ts` — the 5 budget categories + **Plaid category mapping ported
    verbatim** from `budgetlock-data.js` (as required by the handoff), plus seed txns.
  - `budget.ts` — money formatting, suggested-limit formula, per-period spend
    **aggregation** (gauge/bars/status), and gauge SVG geometry.
  - `state.ts` — builds the full per-user state snapshot (incl. server-side summary).
  - `auth.ts`, `db.ts`, `plaid.ts`, `plaidSync.ts`, `http.ts`, `client.ts`.
- `src/app/api/` — auth, profile, budget, transactions, plaid, demo/reset.
- `src/components/` — one client state machine (`App.tsx`) that mirrors the
  prototype's phases (account → questionnaire → onboarding → main app) plus screens
  and overlays.

State persists **server-side per user**; the server component (`app/page.tsx`)
resolves the session and hands the client its full state, so a reload restores the
user exactly where they left off.

## Fidelity notes (prototype/screenshots are the source of truth)

A few things differ from the README prose in the handoff; the working prototype +
screenshots win:

- The "lock ring" is a **car speedometer gauge** (240° sweep, needle, tick marks,
  red redline zone). The metaphor is driving throughout (CRUISING / REDLINE AHEAD /
  OVER REDLINE, "Start driving", "Gauge" tab).
- **5 categories** from `budgetlock-data.js` (Groceries .30, Food & Drink .25,
  Gas & Rides .20, Entertainment .15, Subscriptions .10) — not the 6 in README §5.
- Warn threshold is **0.8** (README prose says 75%); centralized in `tokens.ts`.
- Period (Weekly/Monthly) lives in **Settings** as a segmented toggle; weekly = monthly ÷ 4.
  There is no separate period-picker screen.
- Added a **Login** screen (the prototype only had sign-up), as the handoff requested.

Bonus features preserved from the prototype: manual "Log a purchase", CSV import,
and the transaction-detail sheet.
