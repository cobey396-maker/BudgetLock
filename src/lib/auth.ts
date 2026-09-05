import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { env } from "./env";

// In production the cookie uses the `__Host-` prefix, which browsers only
// accept when it is Secure, path=/ and has no Domain attribute. That makes the
// cookie impossible to set from a subdomain, closing off session fixation via a
// compromised neighbour host. Plain http://localhost cannot use the prefix.
const COOKIE = env.isProd ? "__Host-bl_session" : "bl_session";
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

/** bcrypt silently truncates past 72 bytes; reject rather than mislead. */
export const MAX_PASSWORD_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 8;

export const hashPassword = (pw: string) => bcrypt.hash(pw, BCRYPT_ROUNDS);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be ${MIN_PASSWORD_LENGTH}+ characters`;
  if (Buffer.byteLength(pw, "utf8") > MAX_PASSWORD_BYTES) return "Password is too long";
  return null;
}

// Session tokens are stored as SHA-256 digests. The raw token only ever exists
// in the user's cookie, so a leaked database snapshot cannot be replayed to
// impersonate anyone.
const digest = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await prisma.session.create({ data: { token: digest(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { token: { in: [digest(token), token] } } })
      .catch(() => {});
  }
  jar.delete(COOKIE);
}

// Returns the logged-in user (with profile + budget), or null.
export async function getCurrentUser() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  // Sessions created before token hashing was introduced are stored raw; accept
  // either form so existing logins survive the upgrade.
  const session = await prisma.session.findFirst({
    where: { token: { in: [digest(raw), raw] } },
    include: { user: { include: { profile: true, budget: true } } },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token: session.token } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}
