"use client";
import { useState } from "react";
import type { AppState } from "@/lib/types";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CTA, Field, LogoMark } from "../ui/primitives";

const emailRe = /^\S+@\S+\.\S+$/;
const screenStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "12px 22px 40px",
  overflow: "auto",
  animation: "bl-screen 500ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export default function AuthScreen({ onAuthed }: { onAuthed: (s: AppState) => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const emailInvalid = !!email && !emailRe.test(email.trim());
  const signupValid = name.trim().length > 0 && emailRe.test(email.trim()) && pass.length >= 6;
  const loginValid = emailRe.test(email.trim()) && pass.length > 0;
  const valid = mode === "signup" ? signupValid : loginValid;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const state =
        mode === "signup"
          ? await api.signup({ name: name.trim(), email: email.trim(), password: pass })
          : await api.login({ email: email.trim(), password: pass });
      onAuthed(state as AppState);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div data-screen-label={isSignup ? "Create account" : "Log in"} style={screenStyle}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "34px 0" }}>
        <LogoMark />
        <div className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>
          {isSignup ? "Create your account" : "Welcome back"}
        </div>
        <div style={{ fontSize: 15, color: C.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: 270 }}>
          {isSignup
            ? "One account, one limit, zero surprises at the end of the month."
            : "Log in to pick up right where you left off."}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {isSignup && (
          <Field placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        )}
        <Field
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={emailInvalid}
          autoComplete="email"
        />
        <Field
          type="password"
          placeholder={isSignup ? "Password (6+ characters)" : "Password"}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </div>

      {error ? (
        <div style={{ fontSize: 13, color: C.coral, padding: "12px 4px 0" }}>{error}</div>
      ) : (
        <div style={{ fontSize: 12.5, color: C.textFaint, padding: "12px 4px 0", lineHeight: 1.5 }}>
          {isSignup
            ? "Your password is hashed and stored securely — we never keep it in plain text."
            : ""}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => {
          setMode(isSignup ? "login" : "signup");
          setError("");
        }}
        style={{
          background: "none",
          border: "none",
          color: C.textMuted,
          fontSize: 13.5,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: "8px 0",
        }}
      >
        {isSignup ? (
          <>Already have an account? <span style={{ color: C.mint, fontWeight: 600 }}>Log in</span></>
        ) : (
          <>New here? <span style={{ color: C.mint, fontWeight: 600 }}>Create an account</span></>
        )}
      </button>

      <CTA onClick={submit} disabled={!valid || busy} style={{ marginTop: 8 }}>
        {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </CTA>
    </div>
  );
}
