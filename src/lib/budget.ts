import { CATEGORIES, categorize, type Category } from "./categories";
import { WARN_AT } from "./tokens";

export const money = (n: number, cents = false) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

// Suggested monthly limit from questionnaire answers (README §2 formula).
export function suggestedLimit(p: {
  wage: number;
  expenses: number;
  savingsGoal: number;
  savingsMonths: number;
}): number {
  const perMonth = p.savingsMonths > 0 ? p.savingsGoal / p.savingsMonths : 0;
  const sug = Math.round((p.wage - p.expenses - perMonth) / 25) * 25;
  return sug > 0 ? sug : 0;
}

// Default category limit (monthly), rounded to nearest $10.
export const defaultCatLimit = (monthlyLimit: number, c: Category) =>
  Math.round((monthlyLimit * c.defaultShare) / 10) * 10;

export type StoredTxn = {
  transactionId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  pending: boolean;
  paymentChannel: string;
  pfcPrimary: string | null;
  pfcDetailed: string | null;
  budgetCategory: string | null;
};

const toPlaidShape = (t: StoredTxn) => ({
  budget_category: t.budgetCategory,
  personal_finance_category: { primary: t.pfcPrimary, detailed: t.pfcDetailed },
});

export const catOf = (t: StoredTxn) => categorize(toPlaidShape(t));

// Start of the current week (Sunday), local time, as YYYY-MM-DD.
export function weekStartIso(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// Transactions that count toward the current period (money-out only).
export function periodTxns(txns: StoredTxn[], period: string, now = new Date()): StoredTxn[] {
  if (period === "weekly") {
    const iso = weekStartIso(now);
    return txns.filter((t) => t.date >= iso && t.amount > 0);
  }
  const ym = now.toISOString().slice(0, 7);
  return txns.filter((t) => t.date.startsWith(ym) && t.amount > 0);
}

export type CategoryAggregate = {
  id: string;
  label: string;
  icon: string;
  spent: number;
  limit: number;
  pct: number;
  over: boolean;
  warn: boolean;
};

export type Aggregate = {
  period: string;
  periodWord: string;
  limit: number;
  spent: number;
  pct: number;
  over: boolean;
  warn: boolean;
  status: "cruising" | "warn" | "over";
  categories: CategoryAggregate[];
};

// The core server-side aggregation powering the gauge, bars and lock status.
export function aggregate(
  txns: StoredTxn[],
  monthlyLimit: number,
  period: string,
  categoryLimits: Record<string, number>,
  now = new Date()
): Aggregate {
  const div = period === "weekly" ? 4 : 1;
  const periodWord = period === "weekly" ? "week" : "month";
  const limit = (monthlyLimit || 2000) / div;
  const inPeriod = periodTxns(txns, period, now);

  const catLimitOf = (c: Category) =>
    (categoryLimits[c.id] ?? defaultCatLimit(monthlyLimit || 2000, c)) / div;

  const spent = inPeriod.reduce((a, t) => a + (catOf(t) ? t.amount : 0), 0);
  const pct = limit > 0 ? spent / limit : 0;
  const over = pct >= 1;
  const warn = !over && pct >= WARN_AT;

  const categories: CategoryAggregate[] = CATEGORIES.map((c) => {
    const cSpent = inPeriod.filter((t) => catOf(t) === c.id).reduce((a, t) => a + t.amount, 0);
    const cLimit = catLimitOf(c);
    const cPct = cLimit > 0 ? cSpent / cLimit : 0;
    const cOver = cPct >= 1;
    const cWarn = !cOver && cPct >= WARN_AT;
    return { id: c.id, label: c.label, icon: c.icon, spent: cSpent, limit: cLimit, pct: cPct, over: cOver, warn: cWarn };
  });

  return {
    period,
    periodWord,
    limit,
    spent,
    pct,
    over,
    warn,
    status: over ? "over" : warn ? "warn" : "cruising",
    categories,
  };
}

// ── Gauge geometry (speedometer): 240° sweep, 210° → -30° ──
export const GAUGE = { cx: 150, cy: 152, r: 112 };
export const ARC_LEN = (240 / 360) * 2 * Math.PI * GAUGE.r;

export function polar(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: GAUGE.cx + r * Math.cos(rad), y: GAUGE.cy - r * Math.sin(rad) };
}
export function arcPath(fromDeg: number, toDeg: number, r: number) {
  const a = polar(fromDeg, r);
  const b = polar(toDeg, r);
  const large = fromDeg - toDeg > 180 ? 1 : 0;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
export const pctToDeg = (p: number) => 210 - p * 240;
