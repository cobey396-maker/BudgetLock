import { prisma } from "./db";
import { plaidClient } from "./plaid";
import type { PlaidTxn } from "./plaid";
import { decryptSecret } from "./crypto";

// Upsert a batch of Plaid-shaped transactions for a user; returns # newly added.
async function upsertPlaidTxns(userId: string, txns: PlaidTxn[]) {
  const existing = new Set(
    (await prisma.transaction.findMany({ where: { userId }, select: { transactionId: true } })).map(
      (t) => t.transactionId
    )
  );
  const fresh = txns.filter((t) => !existing.has(t.transaction_id));
  if (fresh.length) {
    await prisma.transaction.createMany({
      data: fresh.map((t) => ({
        transactionId: t.transaction_id,
        userId,
        accountId: t.account_id,
        amount: t.amount,
        isoCurrencyCode: t.iso_currency_code,
        date: t.date,
        name: t.name,
        merchantName: t.merchant_name,
        pending: t.pending,
        paymentChannel: t.payment_channel,
        pfcPrimary: t.personal_finance_category.primary,
        pfcDetailed: t.personal_finance_category.detailed,
        source: "plaid",
      })),
    });
  }
  return fresh.length;
}

// Run Plaid's /transactions/sync cursor loop for a real item; ingest added txns.
export async function syncPlaidItem(userId: string, itemId: string): Promise<number> {
  const item = await prisma.plaidItem.findUnique({ where: { id: itemId } });
  if (!item || !plaidClient) return 0;

  const accessToken = decryptSecret(item.accessToken);

  let cursor = item.cursor || undefined;
  let added: PlaidTxn[] = [];
  let hasMore = true;

  while (hasMore) {
    const resp = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor,
    });
    const data = resp.data;
    added = added.concat(
      data.added.map((t) => ({
        transaction_id: t.transaction_id,
        account_id: t.account_id,
        amount: t.amount,
        iso_currency_code: t.iso_currency_code || "USD",
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name || null,
        pending: t.pending,
        payment_channel: t.payment_channel,
        personal_finance_category: {
          primary: t.personal_finance_category?.primary || null,
          detailed: t.personal_finance_category?.detailed || null,
        },
      }))
    );
    cursor = data.next_cursor;
    hasMore = data.has_more;
  }

  await prisma.plaidItem.update({ where: { id: itemId }, data: { cursor } });
  return upsertPlaidTxns(userId, added);
}

export { upsertPlaidTxns };
