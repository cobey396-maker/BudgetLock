import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, passwordProblem } from "@/lib/auth";
import { buildState } from "@/lib/state";
import { issueToken } from "@/lib/authTokens";
import { sendMail, verifyEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import { ok, err } from "@/lib/http";
import { clientIp, enforce } from "@/lib/rateLimit";

const emailRe = /^\S+@\S+\.\S+$/;
const MAX_NAME = 80;
const MAX_EMAIL = 254;

export async function POST(req: Request) {
  const limited = await enforce("signup", `ip:${await clientIp()}`);
  if (limited) return limited;

  const { name, email, password } = await req.json().catch(() => ({}));
  const cleanName = String(name || "").trim().slice(0, MAX_NAME);
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanName) return err("Name is required");
  if (cleanEmail.length > MAX_EMAIL || !emailRe.test(cleanEmail)) return err("Enter a valid email");

  const pwProblem = passwordProblem(cleanPassword);
  if (pwProblem) return err(pwProblem);

  const passwordHash = await hashPassword(cleanPassword);

  let user;
  try {
    user = await prisma.user.create({
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
  } catch (e) {
    // The unique index is the source of truth: a check-then-create would let two
    // concurrent signups race past it.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("An account with that email already exists", 409);
    }
    throw e;
  }

  await createSession(user.id);

  // Best effort: a mail outage must not stop someone creating an account. The
  // app shows an unconfirmed banner with a resend action either way.
  try {
    const token = await issueToken(user.id, "email_verification");
    await sendMail({ to: user.email, ...verifyEmail(`${env.appUrl}/verify?token=${encodeURIComponent(token)}`) });
  } catch (e) {
    console.error("[budgetlock] could not send the confirmation email", e);
  }

  return ok(await buildState(user.id), { status: 201 });
}
