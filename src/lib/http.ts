import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { env } from "./env";
import { clientIp, enforce, type Bucket } from "./rateLimit";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/**
 * Guard a handler: resolves the user or returns 401, applies a per-user rate
 * limit, and converts an unexpected throw into a 500 without leaking internals
 * to the client. Every stack trace still reaches the platform logs.
 */
export async function withUser<T>(
  fn: (userId: string) => Promise<T>,
  bucket: Bucket = "write"
) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);

  const limited = await enforce(bucket, `user:${user.id}`);
  if (limited) return limited;

  try {
    return await fn(user.id);
  } catch (e) {
    console.error(`[budgetlock] unhandled error for user ${user.id}`, e);
    return err(
      env.isProd ? "Something went wrong. Please try again." : String((e as Error)?.message ?? e),
      500
    );
  }
}

/** Same treatment for handlers that run before a user is resolved. */
export async function guarded(bucket: Bucket, fn: () => Promise<Response>) {
  const limited = await enforce(bucket, `ip:${await clientIp()}`);
  if (limited) return limited;
  try {
    return await fn();
  } catch (e) {
    console.error("[budgetlock] unhandled error", e);
    return err(env.isProd ? "Something went wrong. Please try again." : String(e), 500);
  }
}
