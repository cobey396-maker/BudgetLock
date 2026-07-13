import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

// Guard a handler: resolves the user or returns 401.
export async function withUser<T>(fn: (userId: string) => Promise<T>) {
  const user = await getCurrentUser();
  if (!user) return err("Unauthorized", 401);
  return fn(user.id);
}
