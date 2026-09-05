import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { buildState } from "@/lib/state";
import { categoryById } from "@/lib/categories";
import { withUser, ok, err } from "@/lib/http";

// Local calendar day — `toISOString()` would date an evening purchase tomorrow
// for anyone west of UTC.
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const MAX_CSV_ROWS = 2000;
const MAX_AMOUNT = 1_000_000;
const MAX_NOTE = 120;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return withUser(async (userId) => {
    if (body.type === "manual") {
      const amount = Number(body.amount);
      if (!(amount > 0)) return err("Amount must be greater than 0");
      if (amount > MAX_AMOUNT) return err("That amount is too large");
      const cat = categoryById(body.categoryId);
      const note = String(body.note || "").trim().slice(0, MAX_NOTE);
      await prisma.transaction.create({
        data: {
          transactionId: `manual-${randomUUID()}`,
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
        .map((r) => ({ date: String(r.date), name: String(r.name || "CSV import").slice(0, MAX_NOTE), amount: Math.abs(Number(r.amount)) }))
        .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.amount > 0 && r.amount <= MAX_AMOUNT);
      if (!clean.length) return err("No usable rows found.");
      if (clean.length > MAX_CSV_ROWS) {
        return err(`That file has too many rows (limit ${MAX_CSV_ROWS}). Split it and import again.`);
      }
      const cat = categoryById(body.categoryId);
      const batch = randomUUID();
      await prisma.transaction.createMany({
        data: clean.map((r, i) => ({
          transactionId: `csv-${batch}-${i}`,
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
