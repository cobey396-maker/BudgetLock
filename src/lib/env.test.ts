import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { isFatal, resolveConfig, validateEnv } from "./env";

const DB = "postgresql://user:pw@host:5432/db";
const SECRET = "0".repeat(64);

const check = (source: Record<string, string | undefined>) => {
  const issues = validateEnv(resolveConfig({ NODE_ENV: "production", ...source }));
  return {
    fatal: issues.filter(isFatal).map((i) => i.name),
    warnings: issues.filter((i) => !isFatal(i)).map((i) => i.name),
  };
};

const healthy = { POSTGRES_PRISMA_URL: DB, POSTGRES_URL_NON_POOLING: DB, AUTH_SECRET: SECRET };

describe("validateEnv severity", () => {
  test("a fully configured environment reports nothing", () => {
    assert.deepEqual(check(healthy), { fatal: [], warnings: [] });
  });

  // The regression this file exists for: a half-configured optional
  // integration must never be able to stop the server. It previously took
  // production down, /api/health included, so the cause was invisible.
  test("a half-set Plaid pair warns and is never fatal", () => {
    const r = check({ ...healthy, PLAID_CLIENT_ID: "abc" });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["PLAID_CLIENT_ID / PLAID_SECRET"]);
  });

  test("an unknown PLAID_ENV warns and is never fatal", () => {
    const r = check({ ...healthy, PLAID_ENV: "staging" });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["PLAID_ENV"]);
  });

  test("a missing AUTH_SECRET warns and is never fatal", () => {
    const r = check({ POSTGRES_PRISMA_URL: DB, POSTGRES_URL_NON_POOLING: DB });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["AUTH_SECRET"]);
  });

  test("a short AUTH_SECRET warns and is never fatal", () => {
    const r = check({ ...healthy, AUTH_SECRET: "tooshort" });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["AUTH_SECRET"]);
  });

  test("a missing migration URL warns — only the build needs it", () => {
    const r = check({ POSTGRES_PRISMA_URL: DB, AUTH_SECRET: SECRET });
    assert.deepEqual(r.fatal, []);
    assert.deepEqual(r.warnings, ["POSTGRES_URL_NON_POOLING"]);
  });

  test("only a missing database URL is fatal", () => {
    const r = check({ AUTH_SECRET: SECRET, POSTGRES_URL_NON_POOLING: DB });
    assert.deepEqual(r.fatal, ["POSTGRES_PRISMA_URL"]);
  });

  test("several warnings at once still do not become fatal", () => {
    const r = check({ POSTGRES_PRISMA_URL: DB, PLAID_SECRET: "s", PLAID_ENV: "nope" });
    assert.deepEqual(r.fatal, []);
    assert.ok(r.warnings.length >= 3, `expected several warnings, got ${r.warnings.join(", ")}`);
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
