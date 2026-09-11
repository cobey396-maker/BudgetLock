// Central environment access + validation.
//
// Every env var the app reads goes through here so that a misconfigured
// deployment reports the problem clearly instead of throwing something opaque
// on the first request.
//
// Severity matters more than it looks. Refusing to boot takes the whole site
// down, so that is reserved for configuration without which no request can be
// served at all. Everything else — an optional integration half-configured, a
// variable only the build needs — is a loud warning: logged at boot and
// reported by /api/health, with the app still serving. A misconfigured Plaid
// key is not a reason for nobody to be able to look at their budget.

export type Severity = "fatal" | "warn";
export type Issue = { name: string; problem: string; severity: Severity };

type Source = Record<string, string | undefined>;

/**
 * A URL we can hand to `new URL()` without risk. A malformed
 * NEXT_PUBLIC_APP_URL (a hostname with no scheme is the easy mistake) would
 * otherwise throw while building page metadata and take every route with it.
 */
function safeOrigin(candidate: string, fallback: string): string {
  if (!candidate) return fallback;
  try {
    return new URL(candidate).origin;
  } catch {
    return fallback;
  }
}

const LOCAL_URL = "http://localhost:3200";

export function resolveConfig(source: Source = process.env) {
  const read = (name: string) => (source[name] ?? "").trim();

  const appUrlRaw =
    read("NEXT_PUBLIC_APP_URL") ||
    (read("VERCEL_PROJECT_PRODUCTION_URL") && `https://${read("VERCEL_PROJECT_PRODUCTION_URL")}`) ||
    (read("VERCEL_URL") && `https://${read("VERCEL_URL")}`) ||
    LOCAL_URL;

  return {
    nodeEnv: source.NODE_ENV ?? "development",
    isProd: source.NODE_ENV === "production",

    /** Pooled Postgres URL used at runtime (Prisma `url`). */
    databaseUrl: read("POSTGRES_PRISMA_URL"),
    /** Direct Postgres URL used for migrations (Prisma `directUrl`). */
    databaseDirectUrl: read("POSTGRES_URL_NON_POOLING"),

    /** Secret backing Plaid access-token encryption. */
    authSecret: read("AUTH_SECRET"),

    /** Resend API key. Blank disables outbound email (links go to the log). */
    resendApiKey: read("RESEND_API_KEY"),
    /** Verified sender, e.g. "BudgetLock <noreply@budgetlock.app>". */
    mailFrom: read("MAIL_FROM"),

    plaidClientId: read("PLAID_CLIENT_ID"),
    plaidSecret: read("PLAID_SECRET"),
    plaidEnv: read("PLAID_ENV") || "sandbox",

    /** Canonical public origin, e.g. https://budgetlock.app. Used for metadata. */
    appUrl: safeOrigin(appUrlRaw, LOCAL_URL),
    /** Whether NEXT_PUBLIC_APP_URL was set but unusable. */
    appUrlRejected: Boolean(read("NEXT_PUBLIC_APP_URL")) && safeOrigin(appUrlRaw, "") === "",
  };
}

export type Config = ReturnType<typeof resolveConfig>;

export const env = resolveConfig();

const PLAID_ENVS = ["sandbox", "production"];

/**
 * Collects configuration problems. Only `fatal` issues stop the server; `warn`
 * issues are logged and surfaced by /api/health while the app keeps serving.
 */
export function validateEnv(cfg: Config = env): Issue[] {
  const issues: Issue[] = [];

  // Without a database URL the Prisma client cannot even be constructed, so
  // every request fails regardless. Naming it beats an opaque Prisma error.
  if (!cfg.databaseUrl) {
    issues.push({
      name: "POSTGRES_PRISMA_URL",
      severity: "fatal",
      problem: "missing — attach a Postgres store, or set it to your own pooled connection string",
    });
  }

  // Only `prisma migrate` reads this, and that runs at build time. A runtime
  // instance without it works fine.
  if (!cfg.databaseDirectUrl) {
    issues.push({
      name: "POSTGRES_URL_NON_POOLING",
      severity: "warn",
      problem: "missing — migrations cannot run without it (the non-pooled connection string)",
    });
  }

  // Sessions do not use this; only Plaid token encryption does, and that throws
  // at the point of use. Serving budgets to signed-in users is better than an
  // outage, so this is loud rather than fatal.
  if (!cfg.authSecret) {
    issues.push({
      name: "AUTH_SECRET",
      severity: "warn",
      problem: "missing — bank linking is disabled until it is set (`openssl rand -hex 32`)",
    });
  } else if (cfg.authSecret.length < 32) {
    issues.push({ name: "AUTH_SECRET", severity: "warn", problem: "too short — use at least 32 characters" });
  }

  if (!PLAID_ENVS.includes(cfg.plaidEnv)) {
    issues.push({
      name: "PLAID_ENV",
      severity: "warn",
      problem: `must be one of ${PLAID_ENVS.join(", ")} — falling back to the mock importer`,
    });
  }

  // Plaid keys are optional (blank => built-in mock importer), but half a pair
  // is always a mistake worth reporting.
  if (Boolean(cfg.plaidClientId) !== Boolean(cfg.plaidSecret)) {
    issues.push({
      name: "PLAID_CLIENT_ID / PLAID_SECRET",
      severity: "warn",
      problem: "set both or neither — one without the other silently disables the real Plaid path",
    });
  }

  // Email is what makes account recovery work. Missing it is serious enough to
  // report on every boot, but the app serves fine without it.
  if (Boolean(cfg.resendApiKey) !== Boolean(cfg.mailFrom)) {
    issues.push({
      name: "RESEND_API_KEY / MAIL_FROM",
      severity: "warn",
      problem: "set both or neither — one without the other leaves email disabled",
    });
  } else if (!cfg.resendApiKey) {
    issues.push({
      name: "RESEND_API_KEY / MAIL_FROM",
      severity: "warn",
      problem: "not set — password reset and email verification links are written to the log instead of sent",
    });
  }

  if (cfg.appUrlRejected) {
    issues.push({
      name: "NEXT_PUBLIC_APP_URL",
      severity: "warn",
      problem: `not a valid absolute URL (include the scheme, e.g. https://example.com) — using ${cfg.appUrl}`,
    });
  }

  return issues;
}

export const isFatal = (i: Issue) => i.severity === "fatal";

/** Called once from `instrumentation.ts` when the server boots. */
export function assertEnv() {
  const issues = validateEnv();
  if (!issues.length) return;

  const format = (list: Issue[]) => list.map((i) => `  • ${i.name}: ${i.problem}`).join("\n");
  const fatal = issues.filter(isFatal);
  const warnings = issues.filter((i) => !isFatal(i));

  if (warnings.length) {
    // console.error, not warn: this must be visible in production logs.
    console.error(`[budgetlock] configuration warnings (the app is still serving):\n${format(warnings)}`);
  }
  if (fatal.length) {
    throw new Error(`BudgetLock cannot start:\n${format(fatal)}\n`);
  }
}
