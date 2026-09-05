import { prisma } from "@/lib/db";
import { verifyPassword, destroySession } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { ok, err } from "@/lib/http";
import { enforce } from "@/lib/rateLimit";

// Permanent account deletion. Every related row (sessions, profile, budget,
// bank items, transactions) is removed by the schema's cascading deletes.
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const limited = await enforce("login", `delete-account:${user.id}`);
  if (limited) return limited;

  // Re-authenticate: an irreversible action should not ride on a cookie alone.
  const { password } = await req.json().catch(() => ({}));
  const valid = await verifyPassword(String(password || ""), user.passwordHash);
  if (!valid) return err("That password is incorrect", 401);

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  return ok({ ok: true });
}
