"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CTA, Field, LogoMark } from "../ui/primitives";

const MIN_PASSWORD = 8; // must match MIN_PASSWORD_LENGTH in lib/auth.ts

const screenStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "12px 22px 40px",
  overflow: "auto",
  animation: "bl-screen 500ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export default function ResetPassword({ token }: { token: string }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && pass !== confirm;
  const valid = pass.length >= MIN_PASSWORD && pass === confirm;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.resetPassword({ token, password: pass });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Message
        title="Link incomplete"
        body="That reset link is missing its token. Request a new one from the sign-in screen."
      />
    );
  }

  if (done) {
    return (
      <Message
        title="Password changed"
        body="You're signed in on this device. Anywhere else you were signed in has been signed out."
        cta="Open BudgetLock"
      />
    );
  }

  return (
    <div data-screen-label="Reset password" style={screenStyle}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "34px 0" }}>
        <LogoMark />
        <div className="font-grotesk" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", textAlign: "center" }}>
          Choose a new password
        </div>
        <div style={{ fontSize: 15, color: C.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: 280 }}>
          Setting a new password signs you out everywhere else.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Field
          type="password"
          placeholder={`New password (${MIN_PASSWORD}+ characters)`}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="new-password"
        />
        <Field
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          invalid={mismatch}
          autoComplete="new-password"
        />
      </div>

      <div style={{ fontSize: 12.5, padding: "12px 4px 0", lineHeight: 1.5, color: error || mismatch ? C.coral : C.textFaint }}>
        {error || (mismatch ? "Those passwords don't match." : "")}
      </div>

      <div style={{ flex: 1 }} />

      <CTA onClick={submit} disabled={!valid || busy} style={{ marginTop: 8 }}>
        {busy ? "Saving…" : "Save new password"}
      </CTA>
    </div>
  );
}

/** Terminal state after an email link: one clear sentence and a way onward. */
export function Message({ title, body, cta }: { title: string; body: string; cta?: string }) {
  return (
    <div style={{ ...screenStyle, justifyContent: "center", alignItems: "center", textAlign: "center", gap: 14 }}>
      <LogoMark />
      <div className="font-grotesk" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>
        {title}
      </div>
      <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.55, maxWidth: 290 }}>{body}</div>
      <Link
        href="/"
        className="press font-grotesk"
        style={{
          marginTop: 18,
          height: 54,
          minWidth: 220,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 27,
          background: "linear-gradient(135deg, #5FF0B6 0%, #2BC286 100%)",
          boxShadow: "0 6px 20px rgba(61,220,151,0.25)",
          color: C.onMint,
          fontSize: 17,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {cta ?? "Back to sign in"}
      </Link>
    </div>
  );
}
