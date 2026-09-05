// Central environment access + validation.
//
// Every env var the app reads goes through here so that a misconfigured
// deployment fails loudly at boot with an actionable message instead of
// throwing an opaque error on the first request.

type Issue = { name: string; problem: string };

const isProd = process.env.NODE_ENV === "production";

const read = (name: string) => (process.env[name] ?? "").trim();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd,

  /** Pooled Postgres URL used at runtime (Prisma `url`). */
  databaseUrl: read("POSTGRES_PRISMA_URL"),
  /** Direct Postgres URL used for migrations (Prisma `directUrl`). */
  databaseDirectUrl: read("POSTGRES_URL_NON_POOLING"),

  /** Secret backing session-token derivation and Plaid access-token encryption. */
  authSecret: read("AUTH_SECRET"),

  plaidClientId: read("PLAID_CLIENT_ID"),
  plaidSecret: read("PLAID_SECRET"),
  plaidEnv: read("PLAID_ENV") || "sandbox",

  /** Canonical public origin, e.g. https://budgetlock.app. Used for metadata. */
  appUrl:
    read("NEXT_PUBLIC_APP_URL") ||
    (read("VERCEL_PROJECT_PRODUCTION_URL") && `https://${read("VERCEL_PROJECT_PRODUCTION_URL")}`) ||
    (read("VERCEL_URL") && `https://${read("VERCEL_URL")}`) ||
    "http://localhost:3200",
} as const;

const PLAID_ENVS = ["sandbox", "production"];

/**
 * Collects configuration problems. Anything returned here is fatal in
 * production; in development it is surfaced as a warning so `npm run dev`
 * still starts with a partially-filled `.env`.
 */
export function validateEnv(): Issue[] {
  const issues: Issue[] = [];

  if (!env.databaseUrl) {
    issues.push({
      name: "POSTGRES_PRISMA_URL",
      problem: "missing — attach a Postgres store, or set it to your own pooled connection string",
    });
  }
  if (!env.databaseDirectUrl) {
    issues.push({
      name: "POSTGRES_URL_NON_POOLING",
      problem: "missing — required for running migrations (the non-pooled connection string)",
    });
  }
  if (!env.authSecret) {
    issues.push({ name: "AUTH_SECRET", problem: "missing — generate one with `openssl rand -hex 32`" });
  } else if (env.authSecret.length < 32) {
    issues.push({ name: "AUTH_SECRET", problem: "too short — use at least 32 characters" });
  }
  if (!PLAID_ENVS.includes(env.plaidEnv)) {
    issues.push({ name: "PLAID_ENV", problem: `must be one of ${PLAID_ENVS.join(", ")}` });
  }
  // Plaid keys are optional (blank => built-in mock importer), but half a pair
  // is always a mistake.
  if (Boolean(env.plaidClientId) !== Boolean(env.plaidSecret)) {
    issues.push({
      name: "PLAID_CLIENT_ID / PLAID_SECRET",
      problem: "set both or neither — one without the other disables the real Plaid path silently",
    });
  }

  return issues;
}

/** Called once from `instrumentation.ts` when the server boots. */
export function assertEnv() {
  const issues = validateEnv();
  if (!issues.length) return;

  const report = issues.map((i) => `  • ${i.name}: ${i.problem}`).join("\n");
  if (isProd) {
    throw new Error(`BudgetLock is misconfigured and cannot start:\n${report}\n`);
  }
  console.warn(`\n[budgetlock] environment warnings (fatal in production):\n${report}\n`);
}
