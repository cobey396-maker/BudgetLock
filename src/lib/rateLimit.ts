import { headers } from "next/headers";
import { prisma } from "./db";
import { err } from "./http";

// Fixed-window rate limiting backed by Postgres.
//
// The counter lives in the database rather than in process memory because the
// app runs on serverless functions: an in-memory limiter would reset on every
// cold start and be trivially bypassed by spreading requests across instances.
// The increment is a single atomic `INSERT ... ON CONFLICT DO UPDATE`, so
// concurrent requests cannot lose a count.

export type Limit = { limit: number; windowSeconds: number };

/** Named buckets, so limits live in one place instead of at each call site. */
export const LIMITS = {
  /** Credential-guessing defence against one account. Deliberately tight. */
  login: { limit: 10, windowSeconds: 15 * 60 },
  /**
   * Per-address ceiling. Looser than the per-account limit because offices,
   * schools and mobile carriers put many legitimate users behind one IP.
   */
  loginIp: { limit: 40, windowSeconds: 15 * 60 },
  /** Stops scripted account farming from one address. */
  signup: { limit: 5, windowSeconds: 60 * 60 },
  /** Plaid link/exchange calls cost money and are slow. */
  plaid: { limit: 20, windowSeconds: 60 * 60 },
  /** Catch-all for authenticated writes. */
  write: { limit: 120, windowSeconds: 60 },
} satisfies Record<string, Limit>;

export type Bucket = keyof typeof LIMITS;

export type RateResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

/** Best-effort client address; on Vercel the left-most XFF entry is the caller. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

async function sweepExpired() {
  // Opportunistic GC so the table cannot grow without bound. Cheap enough to
  // run on ~1% of checks and never blocks the request path.
  if (Math.random() > 0.01) return;
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
}

export async function consume(bucket: Bucket, identifier: string): Promise<RateResult> {
  const { limit, windowSeconds } = LIMITS[bucket];
  const key = `${bucket}:${identifier}`;
  const expiresAt = new Date(Date.now() + windowSeconds * 1000);

  try {
    const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"     = CASE WHEN "RateLimit"."expiresAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < now() THEN ${expiresAt} ELSE "RateLimit"."expiresAt" END
      RETURNING "count", "expiresAt"
    `;
    void sweepExpired();

    const row = rows[0];
    if (!row) return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };

    const count = Number(row.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((row.expiresAt.getTime() - Date.now()) / 1000));
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds };
  } catch (e) {
    // Fail open: a rate-limiter outage must not take the whole app down.
    console.error("[budgetlock] rate limit check failed", e);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Clears a bucket for an identifier — used after a successful login. */
export async function reset(bucket: Bucket, identifier: string) {
  await prisma.rateLimit.deleteMany({ where: { key: `${bucket}:${identifier}` } }).catch(() => {});
}

/**
 * Guards a handler. Returns a 429 `Response` when the caller is over budget,
 * otherwise `null` so the caller proceeds.
 */
export async function enforce(bucket: Bucket, identifier: string) {
  const result = await consume(bucket, identifier);
  if (result.allowed) return null;
  const res = err("Too many requests. Please wait a moment and try again.", 429);
  res.headers.set("Retry-After", String(result.retryAfterSeconds));
  return res;
}
