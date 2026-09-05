import { prisma } from "@/lib/db";
import { validateEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// Liveness/readiness probe for uptime monitoring. Reports database reachability
// and configuration state without exposing any values.
export async function GET() {
  const started = Date.now();
  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch (e) {
    console.error("[budgetlock] health check: database unreachable", e);
  }

  const configIssues = validateEnv().map((i) => i.name);
  const healthy = database === "up" && configIssues.length === 0;

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      configIssues,
      latencyMs: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
