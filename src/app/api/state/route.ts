import { buildState } from "@/lib/state";
import { withUser, ok } from "@/lib/http";

export async function GET() {
  return withUser(async (userId) => ok(await buildState(userId)));
}
