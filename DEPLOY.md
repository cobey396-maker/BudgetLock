# Deploying BudgetLock (installable app on your phone)

Goal: put the app at an `https://…` URL so you can open it on your phone and
**Add to Home Screen** — a real, installable PWA that works anywhere, no Mac needed.

Host: **Vercel** (free, built for Next.js). Database: **Vercel Postgres** (free tier).

---

## 1. Put the code on GitHub

The project is already a git repo with a first commit. Create an empty GitHub repo
and push:

```bash
cd ~/budgetlock
# Create a repo named "budgetlock" at https://github.com/new (Private is fine), then:
git remote add origin https://github.com/<your-username>/budgetlock.git
git branch -M main
git push -u origin main
```

(If you have the GitHub CLI: `gh repo create budgetlock --private --source=. --push`.)

Your `.env` (with secrets) is git-ignored and will **not** be uploaded — good.

## 2. Import into Vercel

1. Go to **https://vercel.com** and sign in with GitHub.
2. **Add New → Project → Import** your `budgetlock` repo.
3. Framework preset auto-detects **Next.js**. Don't deploy yet — do step 3 first
   (or deploy, let it fail on the DB, then add the DB and redeploy).

## 3. Attach a Postgres database

1. In your Vercel project → **Storage → Create Database → Postgres** → give it a
   name → **Create**, then **Connect** it to this project.
2. This automatically adds the env vars the app reads:
   `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`. You don't type these.

## 4. Add the remaining environment variables

Project → **Settings → Environment Variables** → add (Production + Preview):

| Name | Value |
|------|-------|
| `AUTH_SECRET` | a long random string — run `openssl rand -hex 32` locally and paste it |
| `PLAID_CLIENT_ID` | your Plaid client_id (optional — omit to use mock bank data) |
| `PLAID_SECRET` | your Plaid **Sandbox** secret |
| `PLAID_ENV` | `sandbox` |

## 5. Deploy

Click **Deploy** (or **Redeploy** if you deployed earlier). The build runs
`prisma db push` against your new Postgres (creating all tables) and then builds
Next.js. When it finishes you get a URL like `https://budgetlock-xxxx.vercel.app`.

> Plaid note: add `https://<your-vercel-url>` to your Plaid Dashboard →
> **Team Settings → API → Allowed redirect URIs** only if you later use hosted
> Plaid Link. The current in-app sandbox flow doesn't require it.

## 6. Install it on your phone

1. Open the Vercel URL in **Safari (iPhone)** or **Chrome (Android)**.
2. iPhone: **Share → Add to Home Screen**. Android: **Install app** prompt.
3. Launch from the home-screen icon — full-screen, no browser bars.

Done. Every `git push` to `main` auto-deploys a new version.

---

## Running locally after this change

Local dev now also uses Postgres (not SQLite). Two options:

- **Reuse the cloud DB:** in Vercel → Storage → your DB → **.env.local** tab, copy
  `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` into your local `.env`, then
  `npm run dev`.
- **Local Postgres:** run one (e.g. `docker run -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres`),
  set both vars to `postgresql://postgres:pw@localhost:5432/postgres`, then
  `npx prisma db push` and `npm run dev`.
