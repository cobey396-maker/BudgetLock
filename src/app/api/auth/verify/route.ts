import { prisma } from "@/lib/db";
import { consumeToken } from "@/lib/authTokens";
import { ok, err } from "@/lib/http";
import { clientIp, enforce } from "@/lib/rateLimit";

// Confirms an email address from the link in the verification email.
// Deliberately does not require a session: people click these links in
// whichever browser their mail app opens.
export async function POST(req: Request) {
  const limited = await enforce("forgotIp", `verify-ip:${await clientIp()}`);
  if (limited) return limited;

  const { token } = await req.json().catch(() => ({}));
  const result = await consumeToken(String(token || ""), "email_verification");

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "That confirmation link has expired. Sign in and request a new one."
        : result.reason === "used"
          ? "That address is already confirmed."
          : "That confirmation link isn't valid.";
    // An already-used link almost always means "you clicked it twice", which is
    // a success from the reader's point of view rather than an error.
    if (result.reason === "used") return ok({ ok: true, alreadyVerified: true });
    return err(message, 400);
  }

  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return ok({ ok: true, alreadyVerified: false });
}

export const GET = () => err("Use POST", 405);
