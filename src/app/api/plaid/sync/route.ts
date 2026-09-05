import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { plaidConfigured } from "@/lib/plaid";
import { syncPlaidItem } from "@/lib/plaidSync";
import { withUser, ok } from "@/lib/http";

// Re-run /transactions/sync for all of a user's linked items (real Plaid only).
export async function POST() {
  return withUser(async (userId) => {
    let imported = 0;
    if (plaidConfigured) {
      const items = await prisma.plaidItem.findMany({ where: { userId } });
      for (const item of items) imported += await syncPlaidItem(userId, item.id);
    }
    return ok({ ...(await buildState(userId)), imported });
  }, "plaid");
}
