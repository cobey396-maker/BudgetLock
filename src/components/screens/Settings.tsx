"use client";
import { useState } from "react";
import Link from "next/link";
import type { AppState } from "@/lib/types";
import { useCtx } from "../ctx";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";

export default function Settings({ openPlaid, openCsv }: { openPlaid: () => void; openCsv: () => void }) {
  const { state, setState, setScreen, setEntry } = useCtx();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const acc = state.account!;
  const weekly = state.budget.period === "weekly";

  const initials = acc.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  async function setPeriod(p: "weekly" | "monthly") {
    const st = (await api.budget({ period: p })) as AppState;
    setState(st);
  }
  async function signOut() {
    await api.logout();
    setState(null);
  }
  async function restartOnboarding() {
    const st = (await api.budget({ setup: false, onboardStep: 0 })) as AppState;
    setEntry("");
    setScreen("dashboard");
    setState(st);
  }
  async function resetData() {
    const st = (await api.resetDemo()) as AppState;
    setEntry("");
    setScreen("dashboard");
    setState(st);
  }
  async function deleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteAccount(deletePassword);
      setState(null);
    } catch (e) {
      setDeleteError((e as Error).message);
      setDeleting(false);
    }
  }

  const Row = ({ icon, title, sub, right, onClick, border = true }: { icon: React.ReactNode; title: string; sub?: string; right?: React.ReactNode; onClick?: () => void; border?: boolean }) => (
    <button onClick={onClick} className="settings-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", border: "none", background: "none", color: C.text, width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderBottom: border ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.mint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{icon}</svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 1 }}>{sub}</div>}
      </div>
      {right ?? (
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke="#55555F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </button>
  );

  return (
    <div data-screen-label="Settings" style={{ flex: 1, overflow: "auto", padding: "8px 18px 20px", display: "flex", flexDirection: "column", gap: 14, animation: "bl-screen 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
      <div className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, padding: "4px 2px 2px" }}>Settings</div>

      {/* account */}
      <div style={{ background: C.surface2, borderRadius: 18, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div className="font-grotesk" style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(61,220,151,0.14)", color: C.mint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.email}</div>
        </div>
        <button onClick={signOut} className="press-chip" style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: C.textMuted2, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Sign out</button>
      </div>

      {/* budget period */}
      <div style={{ background: C.surface2, borderRadius: 18, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.mint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Budget period</div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", background: C.surface, borderRadius: 12, padding: 3, width: 158 }}>
          <div style={{ position: "absolute", top: 3, bottom: 3, left: 3, width: "calc(50% - 3px)", borderRadius: 9, background: C.mint, transform: weekly ? "translateX(0)" : "translateX(100%)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
          <button onClick={() => setPeriod("weekly")} style={{ position: "relative", height: 32, borderRadius: 9, border: "none", background: "transparent", color: weekly ? C.onMint : C.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "color 260ms", padding: 0 }}>Weekly</button>
          <button onClick={() => setPeriod("monthly")} style={{ position: "relative", height: 32, borderRadius: 9, border: "none", background: "transparent", color: weekly ? C.textMuted : C.onMint, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "color 260ms", padding: 0 }}>Monthly</button>
        </div>
      </div>

      {/* actions */}
      <div style={{ background: C.surface2, borderRadius: 18, overflow: "hidden" }}>
        <Row
          icon={<path d="M3 10h18 M3 6l9-4 9 4 M5 10v8 M9 10v8 M15 10v8 M19 10v8 M2 21h20" />}
          title={state.bank.connected ? state.bank.name : "Connect a bank"}
          sub={state.bank.connected ? "Checking · synced via Plaid" : "Sync transactions automatically via Plaid"}
          onClick={openPlaid}
          right={
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: state.bank.connected ? C.mint : C.textMuted, background: state.bank.connected ? "rgba(61,220,151,0.12)" : "rgba(255,255,255,0.06)", padding: "5px 10px", borderRadius: 999, flexShrink: 0 }}>
              {state.bank.connected ? "LINKED" : state.plaidConfigured ? "SANDBOX" : "DEMO"}
            </span>
          }
        />
        <Row icon={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 18v-6 M9 15l3 3 3-3" />} title="Import CSV" sub="For Cash App, Venmo & other non-Plaid apps" onClick={openCsv} />
        <Row icon={<path d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1.5 14h5 M9.5 8h5 M17.5 16h5" />} title="Budget & category limits" onClick={() => setScreen("limits")} />
        <Row icon={<path d="M3 12a9 9 0 1 0 3-6.7 M3 3v5h5" />} title="Restart onboarding" onClick={restartOnboarding} border={false} />
      </div>

      <button onClick={resetData} className="press" style={{ height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: C.textMuted2, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>Reset my data</button>

      {/* Permanent deletion — the privacy policy promises this, so it lives in the app. */}
      {confirmingDelete ? (
        <div style={{ background: C.surface2, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10, border: "1px solid rgba(255,107,107,0.35)" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Delete your account?</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            This permanently removes your budget, transactions and bank connections. It can&apos;t be undone.
          </div>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Confirm your password"
            autoComplete="current-password"
            style={{ height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: C.surface, color: C.text, padding: "0 14px", fontSize: 15, fontFamily: "inherit" }}
          />
          {deleteError && <div style={{ fontSize: 12.5, color: C.coral }}>{deleteError}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setConfirmingDelete(false); setDeletePassword(""); setDeleteError(""); }}
              className="press"
              style={{ flex: 1, height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: C.textMuted2, fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              onClick={deleteAccount}
              disabled={!deletePassword || deleting}
              className="press"
              style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: C.coral, color: "#2A0F0F", fontSize: 14.5, fontWeight: 700, cursor: deletePassword && !deleting ? "pointer" : "not-allowed", opacity: deletePassword && !deleting ? 1 : 0.5, fontFamily: "inherit" }}
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmingDelete(true)} className="press" style={{ height: 48, borderRadius: 14, border: "1px solid rgba(255,107,107,0.35)", background: "transparent", color: C.coral, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete account</button>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, alignItems: "center", fontSize: 12.5, color: C.textFaint, padding: "10px 0 4px" }}>
        <Link href="/privacy" style={{ color: C.textMuted, textDecoration: "none" }}>Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" style={{ color: C.textMuted, textDecoration: "none" }}>Terms</Link>
      </div>
    </div>
  );
}
