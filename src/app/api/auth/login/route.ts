import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { buildState } from "@/lib/state";
import { ok, err } from "@/lib/http";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const cleanEmail = String(email || "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user || !(await verifyPassword(String(password || ""), user.passwordHash))) {
    return err("Incorrect email or password", 401);
  }

  await createSession(user.id);
  return ok(await buildState(user.id));
}
