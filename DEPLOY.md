# Deploying BudgetLock

Goal: put the app at an `https://…` URL you can open on a phone and
**Add to Home Screen** — a real, installable PWA.

Host: **Vercel** (free tier, built for Next.js). Database: **Vercel Postgres**,
Neon, or Supabase — anything that speaks Postgres.

Before your first public launch, also work through **[LAUNCH.md](LAUNCH.md)**.

---

## 1. Put the code on GitHub

```bash
git remote add origin https://github.com/<your-username>/budgetlock.git
git push -u origin main
```

Your `.env` is git-ignored and will not be uploaded.

## 2. Import into Vercel

1. Go to **https://vercel.com** and sign in with GitHub.
2. **Add New → Project → Import** your `budgetlock` repo.
3. The Next.js preset is detected automatically. Don't deploy yet — do step 3 first.

## 3. Attach a Postgres database

1. Project → **Storage → Create Database → Postgres** → **Create**, then
   **Connect** it to this project.
2. That injects `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`
   automatically. You don't type these.

Using Neon or Supabase instead? Set both variables by hand: the pooled connection
string as `POSTGRES_PRISMA_URL`, the direct one as `POSTGRES_URL_NON_POOLING`.

## 4. Add the remaining environment variables

Project → **Settings → Environment Variables** → add for Production + Preview:

| Name | Required | Value |
|------|----------|-------|
| `AUTH_SECRET` | **yes** | `openssl rand -hex 32` — keep it secret, never commit it |
| `NEXT_PUBLIC_APP_URL` | no | your canonical URL once you have a custom domain |
| `NEXT_PUBLIC_OPERATOR_NAME` | before launch | the name on your legal pages |
| `NEXT_PUBLIC_CONTACT_EMAIL` | before launch | a real address you monitor |
| `NEXT_PUBLIC_GOVERNING_LAW` | before launch | e.g. `the State of California, United States` |
| `PLAID_CLIENT_ID` | no | omit to use the mock importer |
| `PLAID_SECRET` | no | the secret matching `PLAID_ENV` |
| `PLAID_ENV` | no | `sandbox` (default) or `production` |

Missing or malformed values make the server **refuse to start in production**,
with the offending variable named in the deploy logs. That's deliberate: a
half-configured finance app is worse than one that is plainly down.

> Rotating `AUTH_SECRET` signs every user out and invalidates stored Plaid access
> tokens (users must re-link their bank). Don't rotate it casually.

## 5. Deploy

Click **Deploy**. The build runs `prisma generate`, then
`scripts/db-deploy.mjs`, then `next build`.

`db-deploy` applies `prisma/migrations` with `prisma migrate deploy`. If your
database was created by an earlier version of this app (which used
`prisma db push` and therefore has no migration history), the script detects that
and baselines it automatically before applying the newer migrations — no manual
step needed.

When the build finishes you get a URL like `https://budgetlock-xxxx.vercel.app`.
Check `https://<your-url>/api/health` — it should return
`{"status":"ok","database":"up","configIssues":[]}`.

## 6. Install it on your phone

1. Open the URL in **Safari (iPhone)** or **Chrome (Android)**.
2. iPhone: **Share → Add to Home Screen**. Android: **Install app**.
3. Launch from the home-screen icon — full-screen, no browser bars.

Every push to `main` auto-deploys a new version.

---

## Changing the schema

```bash
# 1. edit prisma/schema.prisma, then:
npm run db:migrate              # creates a migration and applies it locally
# 2. commit prisma/migrations/ along with the schema change
```

Never run `prisma db push` against production — it applies changes without
recording them, which is what made the original baselining step necessary.

## Going live with real Plaid

The sandbox flow uses `sandboxPublicTokenCreate`, which does not exist in Plaid
production. Moving to real bank data means requesting production access from
Plaid and replacing `src/app/api/plaid/connect/route.ts` with the real Plaid Link
flow (`/api/plaid/link-token` already issues the link token). Add your production
URL to Plaid Dashboard → **Team Settings → API → Allowed redirect URIs**.

## Rollback

Vercel keeps every deployment. Project → **Deployments** → pick the last good one
→ **Promote to Production**. Note that a rollback does **not** revert database
migrations; write migrations to be backward-compatible with the previous release
(add columns, don't drop them in the same deploy).
