#!/usr/bin/env node
/**
 * Applies Prisma migrations at deploy time.
 *
 * BudgetLock's first deployments created their schema with `prisma db push`,
 * which leaves no `_prisma_migrations` bookkeeping table. Running
 * `prisma migrate deploy` against such a database fails on the very first
 * statement ("relation \"User\" already exists"). This script detects that case
 * and baselines the database — marking the init migration as already applied —
 * before deploying the rest. New databases are migrated from empty as usual.
 */
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const BASELINE = "20260101000000_init";

const run = (args) => execFileSync("npx", ["prisma", ...args], { stdio: "inherit" });

if (!process.env.POSTGRES_PRISMA_URL) {
  console.warn("[db-deploy] POSTGRES_PRISMA_URL is not set — skipping migrations.");
  console.warn("[db-deploy] This is expected in CI; a real deploy must have it configured.");
  process.exit(0);
}

const prisma = new PrismaClient();

const tableExists = async (qualified) => {
  const rows = await prisma.$queryRaw`SELECT to_regclass(${qualified}) IS NOT NULL AS ok`;
  return Boolean(rows[0]?.ok);
};

try {
  const hasLedger = await tableExists("public._prisma_migrations");
  const hasSchema = await tableExists('public."User"');

  if (!hasLedger && hasSchema) {
    console.log(`[db-deploy] Existing db-push schema found — baselining ${BASELINE}.`);
    run(["migrate", "resolve", "--applied", BASELINE]);
  }

  run(["migrate", "deploy"]);
  console.log("[db-deploy] Migrations up to date.");
} catch (e) {
  console.error("[db-deploy] Failed:", e?.message ?? e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
