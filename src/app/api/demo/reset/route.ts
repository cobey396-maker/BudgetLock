import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { withUser, ok } from "@/lib/http";

// "Reset demo data" — clears budget/profile/bank/transactions, returning the
// account to a fresh, empty onboarding state ($0 spent, no transactions; keeps login).
export async function POST() {
  return withUser(async (userId) => {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.plaidItem.deleteMany({ where: { userId } }),
      prisma.profile.upsert({
        where: { userId },
        update: {
          wage: 0, savingsGoal: 0, savingsMonths: 12, expenses: 0,
          goals: "[]", age: 0, assets: "[]", profileDone: false, profileStep: 0, suggestedLimit: 0,
        },
        create: { userId },
      }),
      prisma.budget.upsert({
        where: { userId },
        update: { setup: false, onboardStep: 0, monthlyLimit: 2000, period: "monthly", categoryLimits: "{}" },
        create: { userId },
      }),
    ]);
    return ok(await buildState(userId));
  });
}
