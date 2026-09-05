import { prisma } from "@/lib/db";
import { isFatal, validateEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// Liveness/readiness probe for uptime monitoring. Reports database
// reachability and configuration state without exposing any values.
//
// This endpoint has to survive a misconfigured deployment — it is what tells
// you *why* one is broken — so it never throws and never depends on optional
// configuration.
export async function GET() {
  const started = Date.now();

  let database: "up" | "down" = "down";
  let databaseError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch (e) {
    databaseError = (e as Error)?.message?.split("\n")[0] ?? "unknown error";
    console.error("[budgetlock] health check: database unreachable", e);
  }

  const issues = validateEnv();
  const blocking = issues.filter(isFatal).map((i) => `${i.name}: ${i.problem}`);
  const warnings = issues.filter((i) => !isFatal(i)).map((i) => `${i.name}: ${i.problem}`);

  // Warnings alone do not fail the probe — the app is serving. Only an
  // unreachable database or genuinely fatal configuration does.
  const healthy = database === "up" && blocking.length === 0;

  return Response.json(
    {
      status: healthy ? (warnings.length ? "ok-with-warnings" : "ok") : "degraded",
      database,
      databaseError,
      blocking,
      warnings,
      latencyMs: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
