import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { aggregate, defaultCatLimit, money, periodTxns, suggestedLimit, weekStartIso, type StoredTxn } from "./budget";
import { CATEGORIES, categorize } from "./categories";

const txn = (over: Partial<StoredTxn> & { date: string; amount: number }): StoredTxn => ({
  transactionId: `t-${Math.random()}`,
  name: "Test",
  merchantName: null,
  pending: false,
  paymentChannel: "other",
  pfcPrimary: "FOOD_AND_DRINK",
  pfcDetailed: "FOOD_AND_DRINK_RESTAURANT",
  budgetCategory: null,
  ...over,
});

describe("money", () => {
  test("formats whole dollars by default", () => {
    assert.equal(money(1234.56), "$1,235");
  });
  test("formats cents on request", () => {
    assert.equal(money(1234.5, true), "$1,234.50");
  });
});

describe("suggestedLimit", () => {
  test("subtracts expenses and the monthly savings slice, rounded to $25", () => {
    // 5000 - 2000 - (6000/12 = 500) = 2500
    assert.equal(suggestedLimit({ wage: 5000, expenses: 2000, savingsGoal: 6000, savingsMonths: 12 }), 2500);
  });
  test("never goes negative", () => {
    assert.equal(suggestedLimit({ wage: 1000, expenses: 3000, savingsGoal: 0, savingsMonths: 12 }), 0);
  });
  test("treats a zero-month savings horizon as no savings", () => {
    assert.equal(suggestedLimit({ wage: 3000, expenses: 1000, savingsGoal: 5000, savingsMonths: 0 }), 2000);
  });
});

describe("categorize", () => {
  test("prefers the detailed Plaid code over the primary one", () => {
    // Groceries is FOOD_AND_DRINK by primary but must not fall into "food".
    assert.equal(
      categorize({ personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES" } }),
      "groceries"
    );
  });
  test("falls back to the primary code", () => {
    assert.equal(
      categorize({ personal_finance_category: { primary: "TRANSPORTATION", detailed: "TRANSPORTATION_GAS" } }),
      "transport"
    );
  });
  test("a manual override wins over Plaid's classification", () => {
    assert.equal(
      categorize({
        budget_category: "entertainment",
        personal_finance_category: { primary: "TRANSPORTATION", detailed: null },
      }),
      "entertainment"
    );
  });
  test("returns null for spend outside the tracked categories", () => {
    assert.equal(categorize({ personal_finance_category: { primary: "RENT_AND_UTILITIES", detailed: null } }), null);
  });
});

describe("periodTxns", () => {
  test("uses the local calendar month, not the UTC one", () => {
    // 31 Jan 20:00 in a UTC-8 zone is 1 Feb in UTC. The transaction dated
    // 2026-01-31 must still count toward January.
    const now = new Date(2026, 0, 31, 20, 0, 0);
    const rows = [txn({ date: "2026-01-31", amount: 10 }), txn({ date: "2025-12-31", amount: 99 })];
    const inPeriod = periodTxns(rows, "monthly", now);
    assert.equal(inPeriod.length, 1);
    assert.equal(inPeriod[0].date, "2026-01-31");
  });

  test("excludes refunds and credits (negative amounts)", () => {
    const now = new Date(2026, 5, 15);
    const rows = [txn({ date: "2026-06-10", amount: 20 }), txn({ date: "2026-06-11", amount: -35 })];
    assert.equal(periodTxns(rows, "monthly", now).length, 1);
  });

  test("weekly window starts on the preceding Sunday", () => {
    const wednesday = new Date(2026, 5, 17); // Wed 17 June 2026
    assert.equal(weekStartIso(wednesday), "2026-06-14");
    const rows = [txn({ date: "2026-06-14", amount: 5 }), txn({ date: "2026-06-13", amount: 5 })];
    assert.equal(periodTxns(rows, "weekly", wednesday).length, 1);
  });
});

describe("aggregate", () => {
  const now = new Date(2026, 5, 15);

  test("sums only categorised, in-period spend", () => {
    const rows = [
      txn({ date: "2026-06-02", amount: 100 }), // food
      txn({ date: "2026-06-03", amount: 50, pfcPrimary: "RENT_AND_UTILITIES", pfcDetailed: null }), // untracked
      txn({ date: "2026-05-30", amount: 400 }), // previous month
    ];
    const a = aggregate(rows, 1000, "monthly", {}, now);
    assert.equal(a.spent, 100);
    assert.equal(a.limit, 1000);
    assert.equal(a.pct, 0.1);
    assert.equal(a.status, "cruising");
  });

  test("weekly period divides the monthly limit by four", () => {
    const a = aggregate([], 2000, "weekly", {}, now);
    assert.equal(a.limit, 500);
    assert.equal(a.periodWord, "week");
  });

  test("warns at 80% and locks at 100%", () => {
    const warn = aggregate([txn({ date: "2026-06-02", amount: 800 })], 1000, "monthly", {}, now);
    assert.equal(warn.status, "warn");
    assert.equal(warn.over, false);

    const over = aggregate([txn({ date: "2026-06-02", amount: 1000 })], 1000, "monthly", {}, now);
    assert.equal(over.status, "over");
    assert.equal(over.over, true);
  });

  test("category limits fall back to the default share when unset", () => {
    const a = aggregate([], 2000, "monthly", {}, now);
    const groceries = a.categories.find((c) => c.id === "groceries")!;
    assert.equal(groceries.limit, defaultCatLimit(2000, CATEGORIES[0]));
    assert.equal(groceries.limit, 600); // 2000 * 0.30
  });

  test("an explicit category limit overrides the default share", () => {
    const a = aggregate([], 2000, "monthly", { groceries: 100 }, now);
    assert.equal(a.categories.find((c) => c.id === "groceries")!.limit, 100);
  });

  test("a zero limit does not produce NaN or Infinity", () => {
    const a = aggregate([txn({ date: "2026-06-02", amount: 50 })], 0, "monthly", { food: 0 }, now);
    assert.ok(Number.isFinite(a.pct));
    assert.ok(a.categories.every((c) => Number.isFinite(c.pct)));
  });

  test("default category shares add up to the whole budget", () => {
    const total = CATEGORIES.reduce((sum, c) => sum + c.defaultShare, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `shares total ${total}`);
  });
});
