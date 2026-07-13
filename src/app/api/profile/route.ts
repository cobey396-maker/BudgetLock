import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { suggestedLimit } from "@/lib/budget";
import { withUser, ok } from "@/lib/http";

// Partial questionnaire update. When `profileDone` flips true, the suggested
// limit is (re)computed server-side from the answers (README §2 formula).
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const p = body.profile ?? {};

  return withUser(async (userId) => {
    const data: Record<string, unknown> = {};
    if (p.wage !== undefined) data.wage = Number(p.wage) || 0;
    if (p.savingsGoal !== undefined) data.savingsGoal = Number(p.savingsGoal) || 0;
    if (p.savingsMonths !== undefined) data.savingsMonths = Number(p.savingsMonths) || 12;
    if (p.expenses !== undefined) data.expenses = Number(p.expenses) || 0;
    if (p.goals !== undefined) data.goals = JSON.stringify(p.goals ?? []);
    if (p.age !== undefined) data.age = Number(p.age) || 0;
    if (p.assets !== undefined) data.assets = JSON.stringify(p.assets ?? []);
    if (body.profileStep !== undefined) data.profileStep = Number(body.profileStep) || 0;

    if (body.profileDone === true) {
      const merged = await prisma.profile.findUnique({ where: { userId } });
      const wage = (data.wage as number) ?? merged?.wage ?? 0;
      const expenses = (data.expenses as number) ?? merged?.expenses ?? 0;
      const savingsGoal = (data.savingsGoal as number) ?? merged?.savingsGoal ?? 0;
      const savingsMonths = (data.savingsMonths as number) ?? merged?.savingsMonths ?? 12;
      data.suggestedLimit = suggestedLimit({ wage, expenses, savingsGoal, savingsMonths });
      data.profileDone = true;
    }

    await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return ok(await buildState(userId));
  });
}
