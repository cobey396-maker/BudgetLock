"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { LogoMark } from "../ui/primitives";
import { Message } from "./ResetPassword";

type Phase = { kind: "working" } | { kind: "ok"; already: boolean } | { kind: "error"; message: string };

export default function VerifyEmail({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "working" });
  // React runs effects twice in development strict mode; the token is
  // single-use, so a second call would report "already used".
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    if (!token) {
      setPhase({ kind: "error", message: "That confirmation link is missing its token." });
      return;
    }
    api
      .verifyEmail(token)
      .then((r) => setPhase({ kind: "ok", already: Boolean(r.alreadyVerified) }))
      .catch((e) => setPhase({ kind: "error", message: (e as Error).message }));
  }, [token]);

  if (phase.kind === "working") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <LogoMark />
        <div style={{ fontSize: 15, color: C.textMuted }}>Confirming your email…</div>
      </div>
    );
  }

  if (phase.kind === "ok") {
    return (
      <Message
        title={phase.already ? "Already confirmed" : "Email confirmed"}
        body={
          phase.already
            ? "This address was already confirmed. Nothing else to do."
            : "Thanks — if you ever forget your password, we can now get you back in."
        }
        cta="Open BudgetLock"
      />
    );
  }

  return <Message title="Couldn't confirm" body={phase.message} />;
}
