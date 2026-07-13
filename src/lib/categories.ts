// Ported verbatim from the handoff's budgetlock-data.js — the Plaid category
// mapping MUST be preserved (per the Backend Requirements). Shared by client + server.

export type Pfc = { primary?: string | null; detailed?: string | null };

export type Category = {
  id: string;
  label: string;
  plaid: { primary?: string[]; detailed?: string[] };
  icon: string;
  defaultShare: number;
};

export const CATEGORIES: Category[] = [
  {
    id: "groceries",
    label: "Groceries",
    plaid: { detailed: ["FOOD_AND_DRINK_GROCERIES"] },
    icon: "M1 2h3l2.68 12.39a2 2 0 0 0 2 1.61h8.72a2 2 0 0 0 2-1.61L21 6H5.5 M8.5 20.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M17.5 20.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    defaultShare: 0.3,
  },
  {
    id: "food",
    label: "Food & Drink",
    plaid: { primary: ["FOOD_AND_DRINK"] }, // anything FOOD_AND_DRINK that isn't groceries
    icon: "M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M17 3a3 3 0 0 0-3 3v5h6V6a3 3 0 0 0-3-3z M17 11v10",
    defaultShare: 0.25,
  },
  {
    id: "transport",
    label: "Gas & Rides",
    plaid: { primary: ["TRANSPORTATION"] },
    icon: "M3 22h12 M4 9h10 M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18 M14 13h2a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0v-8l-3-3",
    defaultShare: 0.2,
  },
  {
    id: "entertainment",
    label: "Entertainment",
    plaid: { primary: ["ENTERTAINMENT"] },
    icon: "M7 3v18 M17 3v18 M3 7.5h4 M17 7.5h4 M3 12h18 M3 16.5h4 M17 16.5h4 M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    defaultShare: 0.15,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    plaid: { primary: ["GENERAL_SERVICES"] },
    icon: "m17 2 4 4-4 4 M3 11v-1a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v1a4 4 0 0 1-4 4H3",
    defaultShare: 0.1,
  },
];

// Map a Plaid-shaped transaction → budget category id (or null = untracked).
export function categorize(txn: {
  budget_category?: string | null;
  personal_finance_category?: Pfc | null;
}): string | null {
  if (txn.budget_category) return txn.budget_category; // manual override wins
  const pfc = txn.personal_finance_category || {};
  for (const c of CATEGORIES) {
    if (c.plaid.detailed && pfc.detailed && c.plaid.detailed.includes(pfc.detailed)) return c.id;
  }
  for (const c of CATEGORIES) {
    if (c.plaid.primary && pfc.primary && c.plaid.primary.includes(pfc.primary)) return c.id;
  }
  return null;
}

export const categoryById = (id: string | null | undefined) =>
  CATEGORIES.find((c) => c.id === id) || null;

// ── Seed transactions (Plaid Transaction shape) — dates rebased to "recent"
// so a fresh account always has data in the current period. ─────────────
type SeedTxn = {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string;
  date: string;
  name: string;
  merchant_name: string;
  pending: boolean;
  payment_channel: string;
  personal_finance_category: Pfc;
};

const isoDaysAgo = (offset: number) =>
  new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10);

const T = (
  offset: number,
  name: string,
  merchant: string,
  amount: number,
  primary: string,
  detailed: string,
  extra: Partial<SeedTxn> = {}
): SeedTxn => ({
  transaction_id: `seed-${offset}-${merchant.replace(/\W/g, "").toLowerCase()}`,
  account_id: "demo_checking",
  amount,
  iso_currency_code: "USD",
  date: isoDaysAgo(offset),
  name,
  merchant_name: merchant,
  pending: false,
  payment_channel: "in store",
  personal_finance_category: { primary, detailed },
  ...extra,
});

export const seedTransactions = (): SeedTxn[] => [
  T(0, "SWEETGREEN #204", "Sweetgreen", 16.2, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT", { pending: true }),
  T(1, "TRADER JOES #519", "Trader Joe's", 62.4, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES"),
  T(1, "CHEVRON 00873", "Chevron", 51.1, "TRANSPORTATION", "TRANSPORTATION_GAS"),
  T(2, "DOORDASH*THAI BASIL", "DoorDash", 31.6, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT", { payment_channel: "online" }),
  T(2, "LYFT *RIDE FRI", "Lyft", 12.8, "TRANSPORTATION", "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", { payment_channel: "online" }),
  T(4, "COSTCO WHSE #423", "Costco", 143.75, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES"),
  T(5, "UBER TRIP", "Uber", 18.45, "TRANSPORTATION", "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", { payment_channel: "online" }),
  T(6, "BLUE BOTTLE COFFEE", "Blue Bottle", 6.75, "FOOD_AND_DRINK", "FOOD_AND_DRINK_COFFEE"),
  T(7, "SAFEWAY #1205", "Safeway", 56.13, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES"),
  T(7, "OPENAI *CHATGPT", "OpenAI", 20.0, "GENERAL_SERVICES", "GENERAL_SERVICES_OTHER", { payment_channel: "online" }),
  T(8, "SHELL OIL 5744", "Shell", 48.32, "TRANSPORTATION", "TRANSPORTATION_GAS"),
  T(9, "CHIPOTLE 2280", "Chipotle", 14.85, "FOOD_AND_DRINK", "FOOD_AND_DRINK_FAST_FOOD"),
  T(11, "NETFLIX.COM", "Netflix", 15.49, "ENTERTAINMENT", "ENTERTAINMENT_TV_AND_MOVIES", { payment_channel: "online" }),
  T(11, "SPOTIFY USA", "Spotify", 11.99, "ENTERTAINMENT", "ENTERTAINMENT_MUSIC_AND_AUDIO", { payment_channel: "online" }),
  T(11, "APPLE.COM/BILL", "Apple iCloud", 2.99, "GENERAL_SERVICES", "GENERAL_SERVICES_OTHER", { payment_channel: "online" }),
];
