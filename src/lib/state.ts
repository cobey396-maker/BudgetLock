import { prisma } from "./db";
import { aggregate, type StoredTxn } from "./budget";
import { plaidConfigured } from "./plaid";
import { mailConfigured } from "./mail";
import type { AppState, ProfileState, BudgetState } from "./types";

const DEFAULT_PROFILE: ProfileState = {
  wage: 0,
  savingsGoal: 0,
  savingsMonths: 12,
  expenses: 0,
  goals: [],
  age: 0,
  assets: [],
  profileDone: false,
  profileStep: 0,
  suggestedLimit: 0,
};

const DEFAULT_BUDGET: BudgetState = {
  setup: false,
  onboardStep: 0,
  monthlyLimit: 2000,
  period: "monthly",
  categoryLimits: {},
};

const parseJson = <T,>(s: string | null | undefined, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

// Build the full client state snapshot for a user, incl. server-side aggregation.
export async function buildState(userId: string): Promise<AppState> {
  const [user, dbTxns, item] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true, budget: true } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.plaidItem.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!user) throw new Error("user not found");

  const profile: ProfileState = user.profile
    ? {
        wage: user.profile.wage,
        savingsGoal: user.profile.savingsGoal,
        savingsMonths: user.profile.savingsMonths,
        expenses: user.profile.expenses,
        goals: parseJson<string[]>(user.profile.goals, []),
        age: user.profile.age,
        assets: parseJson<string[]>(user.profile.assets, []),
        profileDone: user.profile.profileDone,
        profileStep: user.profile.profileStep,
        suggestedLimit: user.profile.suggestedLimit,
      }
    : { ...DEFAULT_PROFILE };

  const budget: BudgetState = user.budget
    ? {
        setup: user.budget.setup,
        onboardStep: user.budget.onboardStep,
        monthlyLimit: user.budget.monthlyLimit,
        period: user.budget.period,
        categoryLimits: parseJson<Record<string, number>>(user.budget.categoryLimits, {}),
      }
    : { ...DEFAULT_BUDGET };

  const transactions: StoredTxn[] = dbTxns.map((t) => ({
    transactionId: t.transactionId,
    amount: t.amount,
    date: t.date,
    name: t.name,
    merchantName: t.merchantName,
    pending: t.pending,
    paymentChannel: t.paymentChannel,
    pfcPrimary: t.pfcPrimary,
    pfcDetailed: t.pfcDetailed,
    budgetCategory: t.budgetCategory,
  }));

  const summary = aggregate(transactions, budget.monthlyLimit, budget.period, budget.categoryLimits);

  return {
    account: { name: user.name, email: user.email, emailVerified: Boolean(user.emailVerifiedAt) },
    profile,
    budget,
    bank: { connected: Boolean(item), name: item?.bankName ?? "" },
    transactions,
    summary,
    plaidConfigured,
    emailConfigured: mailConfigured,
  };
}
