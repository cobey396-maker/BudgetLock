"use client";
import { useState } from "react";
import Link from "next/link";
import type { AppState } from "@/lib/types";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CTA, Field, LogoMark } from "../ui/primitives";

const emailRe = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 8; // must match MIN_PASSWORD_LENGTH in lib/auth.ts
const legalLink: React.CSSProperties = { color: C.textMuted, textDecoration: "underline" };
const screenStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "12px 22px 40px",
  overflow: "auto",
  animation: "bl-screen 500ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export default function AuthScreen({ onAuthed }: { onAuthed: (s: AppState) => void }) {
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [sent, setSent] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const emailInvalid = !!email && !emailRe.test(email.trim());
  const signupValid = name.trim().length > 0 && emailRe.test(email.trim()) && pass.length >= MIN_PASSWORD;
  const loginValid = emailRe.test(email.trim()) && pass.length > 0;
  const forgotValid = emailRe.test(email.trim());
  const valid = mode === "signup" ? signupValid : mode === "forgot" ? forgotValid : loginValid;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "forgot") {
        const r = await api.forgotPassword(email.trim());
        // The response is deliberately the same whether or not the address has
        // an account, so the copy has to be too.
        setSent(
          r.emailConfigured
            ? r.message
            : "Email isn't configured on this deployment, so no message was sent. The reset link is in the server log."
        );
        setBusy(false);
        return;
      }
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
  const isForgot = mode === "forgot";

  const switchMode = (next: "signup" | "login" | "forgot") => {
    setMode(next);
    setError("");
    setSent("");
  };

  return (
    <div data-screen-label={isForgot ? "Reset password" : isSignup ? "Create account" : "Log in"} style={screenStyle}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "34px 0" }}>
        <LogoMark />
        <div className="font-grotesk" style={{ fontSize: isForgot ? 27 : 30, fontWeight: 700, letterSpacing: "-0.5px", textAlign: "center" }}>
          {isForgot ? "Reset your password" : isSignup ? "Create your account" : "Welcome back"}
        </div>
        <div style={{ fontSize: 15, color: C.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: 270 }}>
          {isForgot
            ? "Enter your email and we'll send you a link to choose a new password."
            : isSignup
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
        {!isForgot && (
          <Field
            type="password"
            placeholder={isSignup ? `Password (${MIN_PASSWORD}+ characters)` : "Password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        )}
        {mode === "login" && (
          <button
            onClick={() => switchMode("forgot")}
            style={{ alignSelf: "flex-end", background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "2px 2px 0", textDecoration: "underline" }}
          >
            Forgot your password?
          </button>
        )}
      </div>

      {sent ? (
        <div style={{ fontSize: 13.5, color: C.mint, padding: "14px 4px 0", lineHeight: 1.55 }}>{sent}</div>
      ) : error ? (
        <div style={{ fontSize: 13, color: C.coral, padding: "12px 4px 0" }}>{error}</div>
      ) : (
        <div style={{ fontSize: 12.5, color: C.textFaint, padding: "12px 4px 0", lineHeight: 1.5 }}>
          {isSignup
            ? "Your password is hashed and stored securely — we never keep it in plain text."
            : isForgot
              ? "If an account exists for that address, the link lands in your inbox within a minute."
              : ""}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => switchMode(isForgot ? "login" : isSignup ? "login" : "signup")}
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
        {isForgot ? (
          <>Remembered it? <span style={{ color: C.mint, fontWeight: 600 }}>Back to log in</span></>
        ) : isSignup ? (
          <>Already have an account? <span style={{ color: C.mint, fontWeight: 600 }}>Log in</span></>
        ) : (
          <>New here? <span style={{ color: C.mint, fontWeight: 600 }}>Create an account</span></>
        )}
      </button>

      <CTA onClick={submit} disabled={!valid || busy} style={{ marginTop: 8 }}>
        {busy ? "Please wait…" : isForgot ? "Send reset link" : isSignup ? "Create account" : "Log in"}
      </CTA>

      <div style={{ fontSize: 11.5, color: C.textFaint, textAlign: "center", lineHeight: 1.6, padding: "12px 6px 0" }}>
        {isSignup ? "By creating an account you agree to our " : "Read our "}
        <Link href="/terms" style={legalLink}>
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" style={legalLink}>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
