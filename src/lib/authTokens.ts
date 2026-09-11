import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

// Single-use, expiring tokens behind the password-reset and email-verification
// links.
//
// Only the SHA-256 digest is stored. The raw token exists in the emailed link
// and nowhere else, so a database leak cannot be replayed to take over an
// account — the same reasoning as session tokens in lib/auth.ts.

export type Purpose = "password_reset" | "email_verification";

const TTL_MINUTES: Record<Purpose, number> = {
  // Short: a reset link is a bearer credential for the account.
  password_reset: 60,
  // Long: people verify email whenever they next open their inbox.
  email_verification: 60 * 24,
};

const digest = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

/**
 * Issues a token, invalidating any outstanding token of the same purpose for
 * that user so only the newest link works.
 */
export async function issueToken(userId: string, purpose: Purpose): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MINUTES[purpose] * 60_000);

  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
    prisma.authToken.create({ data: { tokenHash: digest(token), userId, purpose, expiresAt } }),
  ]);

  return token;
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Validates and burns a token. Marking it used inside the same conditional
 * update makes the burn atomic: two concurrent requests with the same link
 * cannot both succeed.
 */
export async function consumeToken(token: string, purpose: Purpose): Promise<ConsumeResult> {
  const raw = String(token || "");
  if (!raw) return { ok: false, reason: "invalid" };

  const record = await prisma.authToken.findUnique({ where: { tokenHash: digest(raw) } });
  if (!record || record.purpose !== purpose) return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };

  const burned = await prisma.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (burned.count === 0) return { ok: false, reason: "used" };

  return { ok: true, userId: record.userId };
}

/** Opportunistic cleanup so spent and expired tokens do not accumulate. */
export async function sweepExpiredTokens() {
  if (Math.random() > 0.05) return;
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
  await prisma.authToken
    .deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { lt: cutoff } }] } })
    .catch(() => {});
}

export const tokenTtlMinutes = (purpose: Purpose) => TTL_MINUTES[purpose];
