import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { isFatal, resolveConfig, validateEnv } from "./env";

const DB = "postgresql://user:pw@host:5432/db";
const SECRET = "0".repeat(64);

/**
 * A fully configured production environment. Tests start from this and remove
 * or corrupt one variable, so adding a new check to validateEnv extends `base`
 * rather than breaking every assertion.
 */
const base = {
  NODE_ENV: "production",
  POSTGRES_PRISMA_URL: DB,
  POSTGRES_URL_NON_POOLING: DB,
  AUTH_SECRET: SECRET,
  RESEND_API_KEY: "re_test_key",
  MAIL_FROM: "BudgetLock <noreply@budgetlock.test>",
};

const check = (overrides: Record<string, string | undefined> = {}) => {
  const issues = validateEnv(resolveConfig({ ...base, ...overrides }));
  return {
    fatal: issues.filter(isFatal).map((i) => i.name),
    warnings: issues.filter((i) => !isFatal(i)).map((i) => i.name),
  };
};

describe("validateEnv severity", () => {
  test("a fully configured environment reports nothing", () => {
    assert.deepEqual(check(), { fatal: [], warnings: [] });
  });

  // The regression this file exists for: a half-configured optional
  // integration must never be able to stop the server. It previously took
  // production down, /api/health included, so the cause was invisible.
  test("a half-set Plaid pair warns and is never fatal", () => {
    const r = check({ PLAID_CLIENT_ID: "abc" });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["PLAID_CLIENT_ID / PLAID_SECRET"]);
  });

  test("an unknown PLAID_ENV warns and is never fatal", () => {
    const r = check({ PLAID_ENV: "staging" });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["PLAID_ENV"]);
  });

  test("a missing AUTH_SECRET warns and is never fatal", () => {
    const r = check({ AUTH_SECRET: undefined });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["AUTH_SECRET"]);
  });

  test("a short AUTH_SECRET warns and is never fatal", () => {
    const r = check({ AUTH_SECRET: "tooshort" });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["AUTH_SECRET"]);
  });

  test("a missing migration URL warns — only the build needs it", () => {
    const r = check({ POSTGRES_URL_NON_POOLING: undefined });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["POSTGRES_URL_NON_POOLING"]);
  });

  test("unconfigured email warns — recovery breaks, the app does not", () => {
    const r = check({ RESEND_API_KEY: undefined, MAIL_FROM: undefined });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["RESEND_API_KEY / MAIL_FROM"]);
  });

  test("a half-set mail pair warns and is never fatal", () => {
    const r = check({ MAIL_FROM: undefined });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["RESEND_API_KEY / MAIL_FROM"]);
  });

  test("only a missing database URL is fatal", () => {
    const r = check({ POSTGRES_PRISMA_URL: undefined });
    assert.deepEqual(r.fatal, ["POSTGRES_PRISMA_URL"]);
  });

  test("several warnings at once still do not become fatal", () => {
    const r = check({
      POSTGRES_URL_NON_POOLING: undefined,
      PLAID_SECRET: "s",
      PLAID_ENV: "nope",
      RESEND_API_KEY: undefined,
      MAIL_FROM: undefined,
    });
    assert.deepEqual(r.fatal, []);
    assert.ok(r.warnings.length >= 4, `expected several warnings, got ${r.warnings.join(", ")}`);
  });
});

describe("resolveConfig app URL", () => {
  test("keeps a valid absolute URL", () => {
    assert.equal(resolveConfig({ NEXT_PUBLIC_APP_URL: "https://budgetlock.app" }).appUrl, "https://budgetlock.app");
  });

  test("falls back rather than throwing on a URL with no scheme", () => {
    const cfg = resolveConfig({ NEXT_PUBLIC_APP_URL: "budgetlock.app" });
    assert.equal(cfg.appUrl, "http://localhost:3200");
    assert.equal(cfg.appUrlRejected, true);
    // The value must always be safe to pass to `new URL()` — page metadata does.
    assert.doesNotThrow(() => new URL(cfg.appUrl));
  });

  test("derives the origin from Vercel's production host", () => {
    const cfg = resolveConfig({ VERCEL_PROJECT_PRODUCTION_URL: "budget-lock.vercel.app" });
    assert.equal(cfg.appUrl, "https://budget-lock.vercel.app");
    assert.equal(cfg.appUrlRejected, false);
  });

  test("defaults to localhost with nothing set", () => {
    assert.equal(resolveConfig({}).appUrl, "http://localhost:3200");
  });
});
