# Launch checklist

What's already done, and what's still on you before BudgetLock is a public web app.

## Done in the codebase

- [x] Postgres schema managed with **migrations**, with automatic baselining for
      databases created by the old `prisma db push` build.
- [x] **Environment validation** at boot — a misconfigured production deploy
      fails immediately and names the variable.
- [x] **Rate limiting** on login (per account and per IP), signup, Plaid calls and
      authenticated writes, enforced in Postgres so it survives cold starts.
- [x] **Session tokens hashed at rest**, `__Host-` prefixed cookie, 30-day expiry.
- [x] **Plaid access tokens encrypted at rest** (AES-256-GCM, key from `AUTH_SECRET`).
- [x] Password policy: 8-character minimum, bcrypt cost 12, 72-byte cap.
- [x] Login cannot be used to enumerate registered emails.
- [x] Security headers: CSP, HSTS, frame denial, nosniff, referrer and permissions
      policy; `no-store` on all API responses.
- [x] Fonts self-hosted — no third-party requests, no trackers, no analytics.
- [x] **PWA**: PNG icon set (including maskable and apple-touch), full manifest,
      service worker with an offline shell.
- [x] SEO/social: `metadataBase`, Open Graph and Twitter cards, OG image,
      `robots.txt`, `sitemap.xml`.
- [x] Error boundaries (`error.tsx`, `global-error.tsx`), a real 404 page, and an
      offline page.
- [x] `/api/health` for uptime monitoring.
- [x] **Account deletion** in Settings, password-confirmed, cascading to every table.
- [x] Privacy policy and terms pages, linked from sign-up and Settings.
- [x] Unit tests for the aggregation, category mapping and CSV parser; CI running
      lint + typecheck + tests + build.
- [x] Input caps on transaction amounts, notes, names and CSV row counts.
- [x] **Password reset**: single-use links, 60-minute expiry, every session
      destroyed on completion, no account enumeration, per-address send limits.
- [x] **Email verification** on signup, with a resend action and a Settings
      banner when unconfirmed. Completing a reset also confirms the address.

## Before you flip it public

### Required

- [ ] Set `AUTH_SECRET` in Vercel (`openssl rand -hex 32`). Never reuse the
      development value.
- [ ] Set `RESEND_API_KEY` and `MAIL_FROM` in Vercel, and send yourself a reset
      email end to end. Until this is done nobody can recover an account.
- [ ] Fill in `NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL` and
      `NEXT_PUBLIC_GOVERNING_LAW`, and **read `/privacy` and `/terms` end to end**.
      They are a working draft written to match what the app actually does — they
      are not legal advice. If you are handling real users' bank data, have a
      lawyer review them.
- [ ] Point a custom domain at the deployment and set `NEXT_PUBLIC_APP_URL` to it.
- [ ] Verify `/api/health` returns `status: "ok"` on production.
- [ ] Install it on an iPhone and an Android phone and confirm the home-screen
      icon, splash colour and offline page.

### Strongly recommended

- [x] **Password reset** and **email verification** are built. They need email
      configured to reach anyone: set `RESEND_API_KEY` and `MAIL_FROM`. Until
      you do, links are written to the server log and `/api/health` says so.
- [ ] **Error monitoring** (Sentry or similar). Right now failures only reach the
      platform logs, so you learn about them by looking.
- [ ] **Uptime monitoring** hitting `/api/health` every few minutes.
- [ ] **Database backups.** Confirm your provider's schedule and, once, actually
      restore one somewhere else to prove it works.
- [ ] Decide whether signups are open or invite-only for the first weeks.

### If you want real bank data

- [ ] Apply for Plaid **production** access — sandbox keys only return fake banks.
- [ ] Replace the sandbox shortcut in `src/app/api/plaid/connect/route.ts` with
      the real Plaid Link flow (`/api/plaid/link-token` already mints the token).
- [ ] Add a "disconnect bank" action. The privacy policy says users can disconnect
      from Settings; today they can only reset all their data.
- [ ] Re-read Plaid's developer policy on data retention and end-user disclosures.

### Nice to have

- [ ] A marketing landing page for logged-out visitors — the root URL currently
      opens straight onto the sign-up form.
- [ ] Recurring background sync so linked banks refresh without the user tapping.
- [ ] Export-my-data (CSV or JSON), which pairs with the deletion flow.
