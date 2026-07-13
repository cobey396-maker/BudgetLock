import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { withUser, ok } from "@/lib/http";

// Budgets CRUD: monthly limit, period, per-category splits, onboarding progress.
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));

  return withUser(async (userId) => {
    const data: Record<string, unknown> = {};
    if (body.monthlyLimit !== undefined) data.monthlyLimit = Math.max(0, Number(body.monthlyLimit) || 0);
    if (body.period !== undefined) data.period = body.period === "weekly" ? "weekly" : "monthly";
    if (body.categoryLimits !== undefined) data.categoryLimits = JSON.stringify(body.categoryLimits ?? {});
    if (body.setup !== undefined) data.setup = Boolean(body.setup);
    if (body.onboardStep !== undefined) data.onboardStep = Number(body.onboardStep) || 0;

    await prisma.budget.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return ok(await buildState(userId));
  });
}
