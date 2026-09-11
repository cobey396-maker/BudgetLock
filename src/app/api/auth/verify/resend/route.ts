import { prisma } from "@/lib/db";
import { issueToken } from "@/lib/authTokens";
import { sendMail, verifyEmail, mailConfigured } from "@/lib/mail";
import { env } from "@/lib/env";
import { withUser, ok } from "@/lib/http";

// Re-sends the confirmation email to the signed-in user's address.
export async function POST() {
  return withUser(async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return ok({ ok: true, emailConfigured: mailConfigured });
    if (user.emailVerifiedAt) return ok({ ok: true, alreadyVerified: true, emailConfigured: mailConfigured });

    const token = await issueToken(user.id, "email_verification");
    const url = `${env.appUrl}/verify?token=${encodeURIComponent(token)}`;
    const result = await sendMail({ to: user.email, ...verifyEmail(url) });

    return ok({ ok: true, delivered: result.delivered, emailConfigured: mailConfigured });
  }, "forgot");
}
