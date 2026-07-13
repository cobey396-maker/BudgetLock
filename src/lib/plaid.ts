import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Whether real Plaid sandbox credentials are configured. When absent we fall
// back to a built-in mock that returns the same Plaid Transaction shape, so the
// full Link -> /transactions/sync flow works end-to-end without creds.
export const plaidConfigured = Boolean(
  process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET
);

export const plaidClient = plaidConfigured
  ? new PlaidApi(
      new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
            "PLAID-SECRET": process.env.PLAID_SECRET,
          },
        },
      })
    )
  : null;

export type PlaidTxn = {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string;
  date: string;
  name: string;
  merchant_name: string | null;
  pending: boolean;
  payment_channel: string;
  personal_finance_category: { primary: string | null; detailed: string | null };
};

const isoDaysAgo = (offset: number) =>
  new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10);

// Mock "bank" transactions imported on connect (mirrors the prototype's
// plaidImportTxns). Same Plaid shape used by the real /transactions/sync path.
export function mockImportTxns(bankTag: string): PlaidTxn[] {
  const P = (
    id: string,
    offset: number,
    name: string,
    merchant: string,
    amount: number,
    primary: string,
    detailed: string,
    channel = "in store"
  ): PlaidTxn => ({
    transaction_id: `plaid-${bankTag}-${id}`,
    account_id: "plaid_checking",
    amount,
    iso_currency_code: "USD",
    date: isoDaysAgo(offset),
    name,
    merchant_name: merchant,
    pending: false,
    payment_channel: channel,
    personal_finance_category: { primary, detailed },
  });
  return [
    P("cvs", 0, "WHOLEFDS MKT 10235", "Whole Foods", 47.82, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES"),
    P("uber", 1, "UBER TRIP HELP.UBER.COM", "Uber", 22.15, "TRANSPORTATION", "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", "online"),
    P("hulu", 2, "HULU 87421-US", "Hulu", 17.99, "ENTERTAINMENT", "ENTERTAINMENT_TV_AND_MOVIES", "online"),
    P("taco", 3, "TST* LA TAQUERIA", "La Taqueria", 28.4, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT"),
  ];
}
