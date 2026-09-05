import { plaidClient, plaidConfigured } from "@/lib/plaid";
import { withUser, ok } from "@/lib/http";

// Creates a Plaid Link token (real sandbox). Returned for a future real Plaid
// Link widget; the current UI uses the in-app sheet + /connect. Mock when unconfigured.
export async function POST() {
  return withUser(async (userId) => {
    if (!plaidConfigured || !plaidClient) {
      return ok({ link_token: "mock-link-token", mock: true });
    }
    const { Products, CountryCode } = await import("plaid");
    const resp = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "BudgetLock",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    return ok({ link_token: resp.data.link_token, mock: false });
  }, "plaid");
}
