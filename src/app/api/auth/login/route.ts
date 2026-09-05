import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { buildState } from "@/lib/state";
import { ok, err } from "@/lib/http";
import { clientIp, enforce, reset } from "@/lib/rateLimit";

// A bcrypt hash of a value nobody knows. Comparing against it when the email is
// unknown keeps the response time of "no such user" and "wrong password" alike,
// so the endpoint cannot be used to enumerate registered addresses.
const DUMMY_HASH = "$2a$12$9KsL5H3UBTS36LUNQnzsYeUCTpPuboJoSAevKGMeO1KV6V1DaV.mi";

export async function POST(req: Request) {
  const ip = await clientIp();
  const ipLimited = await enforce("loginIp", `ip:${ip}`);
  if (ipLimited) return ipLimited;

  const { email, password } = await req.json().catch(() => ({}));
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (cleanEmail) {
    const emailLimited = await enforce("login", `account:${cleanEmail}`);
    if (emailLimited) return emailLimited;
  }

  const user = cleanEmail ? await prisma.user.findUnique({ where: { email: cleanEmail } }) : null;
  const valid = await verifyPassword(cleanPassword, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) return err("Incorrect email or password", 401);

  await createSession(user.id);
  await reset("login", `account:${cleanEmail}`);
  return ok(await buildState(user.id));
}
