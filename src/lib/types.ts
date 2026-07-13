import type { Aggregate, StoredTxn } from "./budget";

export type ProfileState = {
  wage: number;
  savingsGoal: number;
  savingsMonths: number;
  expenses: number;
  goals: string[];
  age: number;
  assets: string[];
  profileDone: boolean;
  profileStep: number;
  suggestedLimit: number;
};

export type BudgetState = {
  setup: boolean;
  onboardStep: number;
  monthlyLimit: number;
  period: string;
  categoryLimits: Record<string, number>;
};

export type AppState = {
  account: { name: string; email: string } | null;
  profile: ProfileState;
  budget: BudgetState;
  bank: { connected: boolean; name: string };
  transactions: StoredTxn[];
  summary: Aggregate; // server-computed spend aggregation
  plaidConfigured: boolean;
};
