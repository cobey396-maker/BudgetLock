import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { buildState } from "@/lib/state";
import { ok, err } from "@/lib/http";

const emailRe = /^\S+@\S+\.\S+$/;

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanName) return err("Name is required");
  if (!emailRe.test(cleanEmail)) return err("Enter a valid email");
  if (String(password || "").length < 6) return err("Password must be 6+ characters");

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return err("An account with that email already exists", 409);

  const passwordHash = await hashPassword(String(password));
  const user = await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      profile: { create: {} },
      budget: { create: {} },
      // Fresh accounts start empty ($0 spent, no transactions). Users add
      // spending by connecting a bank (Plaid), importing CSV, or logging manually.
    },
  });

  await createSession(user.id);
  return ok(await buildState(user.id), { status: 201 });
}
