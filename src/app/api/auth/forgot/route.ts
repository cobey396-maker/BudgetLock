import { prisma } from "@/lib/db";
import { issueToken, sweepExpiredTokens, tokenTtlMinutes } from "@/lib/authTokens";
import { passwordResetEmail, sendMail, mailConfigured } from "@/lib/mail";
import { env } from "@/lib/env";
import { ok, err } from "@/lib/http";
import { clientIp, enforce } from "@/lib/rateLimit";

// Requests a password-reset link.
//
// The response is identical whether or not the address has an account: telling
// the caller "no such user" would turn this into an account-enumeration oracle,
// which is exactly what the login endpoint is careful to avoid.
export async function POST(req: Request) {
  const ip = await clientIp();
  const ipLimited = await enforce("forgotIp", `ip:${ip}`);
  if (ipLimited) return ipLimited;

  const { email } = await req.json().catch(() => ({}));
  const cleanEmail = String(email || "").trim().toLowerCase();

  // Per-address limit as well, so one mailbox cannot be flooded from many IPs.
  if (cleanEmail) {
    const emailLimited = await enforce("forgot", `account:${cleanEmail}`);
    if (emailLimited) return emailLimited;
  }

  const generic = {
    ok: true,
    message: "If an account exists for that address, a reset link is on its way.",
    // Lets the UI warn the operator (not the user) that nothing was actually
    // sent, instead of silently promising an email that cannot arrive.
    emailConfigured: mailConfigured,
  };

  if (!cleanEmail) return ok(generic);

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) return ok(generic);

  const token = await issueToken(user.id, "password_reset");
  const url = `${env.appUrl}/reset?token=${encodeURIComponent(token)}`;

  const result = await sendMail({
    to: user.email,
    ...passwordResetEmail(url, tokenTtlMinutes("password_reset")),
  });
  if (!result.delivered) {
    console.error(`[budgetlock] reset link for ${user.email} was not delivered: ${result.reason}`);
  }

  void sweepExpiredTokens();
  return ok(generic);
}

export const GET = () => err("Use POST", 405);
