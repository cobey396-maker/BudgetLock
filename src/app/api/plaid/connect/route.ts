import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { plaidClient, plaidConfigured, mockImportTxns } from "@/lib/plaid";
import { syncPlaidItem, upsertPlaidTxns } from "@/lib/plaidSync";
import { withUser, ok, err } from "@/lib/http";

// Connect a bank: real path exchanges a sandbox public token → access token and
// runs /transactions/sync; mock path stores a stub item and ingests mock txns.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const bankName = String(body.bankName || "your bank").trim();

  return withUser(async (userId) => {
    // ── Real Plaid sandbox ──
    if (plaidConfigured && plaidClient) {
      try {
        const { Products } = await import("plaid");
        const pub = await plaidClient.sandboxPublicTokenCreate({
          institution_id: "ins_109508", // First Platypus Bank (sandbox)
          initial_products: [Products.Transactions],
        });
        const exch = await plaidClient.itemPublicTokenExchange({
          public_token: pub.data.public_token,
        });
        const item = await prisma.plaidItem.create({
          data: {
            userId,
            itemId: exch.data.item_id,
            accessToken: exch.data.access_token,
            bankName,
          },
        });
        // Sandbox transactions can lag; retry the sync a few times.
        let imported = 0;
        for (let i = 0; i < 4 && imported === 0; i++) {
          imported = await syncPlaidItem(userId, item.id);
          if (imported === 0) await new Promise((r) => setTimeout(r, 1500));
        }
        return ok({ ...(await buildState(userId)), imported });
      } catch {
        // Fall through to mock so the demo never dead-ends.
      }
    }

    // ── Mock fallback (same Plaid transaction shape) ──
    const item = await prisma.plaidItem.create({
      data: { userId, itemId: `mock-${Date.now()}`, accessToken: "mock", bankName },
    });
    const bankTag = bankName.replace(/\W/g, "").toLowerCase() || "bank";
    const imported = await upsertPlaidTxns(userId, mockImportTxns(bankTag));
    void item;
    return ok({ ...(await buildState(userId)), imported });
  });
}

export const GET = () => err("Use POST", 405);
