import { prisma } from "@/lib/db";
import { consumeToken } from "@/lib/authTokens";
import { createSession, hashPassword, passwordProblem } from "@/lib/auth";
import { buildState } from "@/lib/state";
import { ok, err } from "@/lib/http";
import { clientIp, enforce, reset as resetLimit } from "@/lib/rateLimit";

// Completes a password reset.
//
// Anyone holding the link can set the password, so every outcome here is
// deliberate: the token is burned atomically, every existing session is
// destroyed (a reset is how you lock out someone who already got in), and the
// resetter is signed in on a fresh session.
export async function POST(req: Request) {
  const limited = await enforce("forgotIp", `reset-ip:${await clientIp()}`);
  if (limited) return limited;

  const { token, password } = await req.json().catch(() => ({}));
  const cleanPassword = String(password || "");

  const problem = passwordProblem(cleanPassword);
  if (problem) return err(problem);

  const result = await consumeToken(String(token || ""), "password_reset");
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "That reset link has expired. Request a new one."
        : result.reason === "used"
          ? "That reset link has already been used. Request a new one."
          : "That reset link isn't valid. Request a new one.";
    return err(message, 400);
  }

  const passwordHash = await hashPassword(cleanPassword);

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: result.userId },
      // Holding the reset link proves control of the mailbox, so this doubles
      // as email verification.
      data: { passwordHash, emailVerifiedAt: new Date() },
    });
    // Any session opened before the reset belongs to whoever knew the old
    // password — including an attacker the reset is meant to evict.
    await tx.session.deleteMany({ where: { userId: result.userId } });
    // Outstanding reset links for this account are now moot.
    await tx.authToken.deleteMany({
      where: { userId: result.userId, purpose: "password_reset", usedAt: null },
    });
    return updated;
  });

  await createSession(user.id);
  // A successful reset clears the failed-login budget for that address.
  await resetLimit("login", `account:${user.email}`);

  return ok(await buildState(user.id));
}

export const GET = () => err("Use POST", 405);
