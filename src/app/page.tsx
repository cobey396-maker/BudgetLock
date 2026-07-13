import { getCurrentUser } from "@/lib/auth";
import { buildState } from "@/lib/state";
import App from "@/components/App";
import type { AppState } from "@/lib/types";
import { plaidConfigured } from "@/lib/plaid";

// Server component: resolves the session and hands the client its full state,
// so the app restores exactly where the user left off on reload.
export default async function Home() {
  const user = await getCurrentUser();
  const initial: AppState | null = user ? await buildState(user.id) : null;
  return <App initial={initial} plaidConfigured={plaidConfigured} />;
}
