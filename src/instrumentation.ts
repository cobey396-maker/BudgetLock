// Next.js calls `register()` once per server start, before any request is
// handled. Validating configuration here means a bad deployment fails
// immediately and visibly instead of surfacing as 500s later.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertEnv } = await import("./lib/env");
  assertEnv();
}
