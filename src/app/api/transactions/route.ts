import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { categoryById } from "@/lib/categories";
import { withUser, ok, err } from "@/lib/http";

const todayIso = () => new Date().toISOString().slice(0, 10);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return withUser(async (userId) => {
    if (body.type === "manual") {
      const amount = Number(body.amount);
      if (!(amount > 0)) return err("Amount must be greater than 0");
      const cat = categoryById(body.categoryId);
      const note = String(body.note || "").trim();
      await prisma.transaction.create({
        data: {
          transactionId: `manual-${userId}-${Date.now()}`,
          userId,
          accountId: "manual_entry",
          amount,
          date: todayIso(),
          name: note || cat?.label || "Purchase",
          merchantName: note || null,
          pending: false,
          paymentChannel: "other",
          pfcPrimary: cat?.plaid.primary ? cat.plaid.primary[0] : "FOOD_AND_DRINK",
          pfcDetailed: cat?.plaid.detailed ? cat.plaid.detailed[0] : null,
          budgetCategory: cat?.id ?? null,
          source: "manual",
        },
      });
      return ok(await buildState(userId));
    }

    if (body.type === "csv") {
      const rows: { date: string; name: string; amount: number }[] = Array.isArray(body.rows)
        ? body.rows
        : [];
      const clean = rows
        .map((r) => ({ date: String(r.date), name: String(r.name || "CSV import"), amount: Math.abs(Number(r.amount)) }))
        .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.amount > 0);
      if (!clean.length) return err("No usable rows found.");
      const cat = categoryById(body.categoryId);
      const now = Date.now();
      await prisma.transaction.createMany({
        data: clean.map((r, i) => ({
          transactionId: `csv-${userId}-${now}-${i}`,
          userId,
          accountId: "csv_import",
          amount: r.amount,
          date: r.date,
          name: r.name,
          merchantName: r.name,
          pending: false,
          paymentChannel: "other",
          budgetCategory: cat?.id ?? null,
          source: "csv",
        })),
      });
      const total = clean.reduce((a, r) => a + r.amount, 0);
      return ok({ ...(await buildState(userId)), imported: clean.length, importedTotal: total });
    }

    return err("Unknown transaction type");
  });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return err("Missing id");
  return withUser(async (userId) => {
    await prisma.transaction.deleteMany({ where: { transactionId: id, userId } });
    return ok(await buildState(userId));
  });
}
