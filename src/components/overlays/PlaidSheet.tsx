"use client";
import { useState } from "react";
import type { AppState } from "@/lib/types";
import { useCtx } from "../ctx";
import { api } from "@/lib/client";

const BANKS = [
  { name: "Chase", initials: "CH", color: "#1A5DB5" },
  { name: "Bank of America", initials: "BA", color: "#C0313E" },
  { name: "Wells Fargo", initials: "WF", color: "#B8433C" },
  { name: "Capital One", initials: "C1", color: "#26547C" },
  { name: "Citi", initials: "CI", color: "#2A7DB8" },
];

type Step = "intro" | "banks" | "creds" | "connecting" | "success";

export default function PlaidSheet({ onClose }: { onClose: () => void }) {
  const { setState, plaidConfigured } = useCtx();
  const [step, setStep] = useState<Step>("intro");
  const [bank, setBank] = useState<string>("your bank");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [imported, setImported] = useState(0);

  async function submit() {
    if (!user || !pass) return;
    setStep("connecting");
    try {
      const res = (await api.connectBank(bank)) as AppState & { imported: number };
      setImported(res.imported);
      setState(res);
      setStep("success");
    } catch {
      setStep("creds");
    }
  }

  const darkBtn: React.CSSProperties = { width: "100%", height: 50, borderRadius: 12, border: "none", background: "#111214", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.55)", animation: "bl-fade 250ms ease-out" }}>
      <div data-screen-label="Plaid Link" style={{ background: "#FFFFFF", color: "#111214", borderRadius: "24px 24px 0 0", padding: "20px 22px 44px", minHeight: "62%", display: "flex", flexDirection: "column", fontFamily: "-apple-system, system-ui, sans-serif", animation: "bl-sheet 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 6v4l8 4 8-4V6l-8-4z M4 14l8 4 8-4" stroke="#111214" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.2px" }}>Plaid</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: "#6B7280", background: "#F3F4F6", padding: "3px 8px", borderRadius: 999 }}>{plaidConfigured ? "SANDBOX" : "DEMO"}</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="press-sm" style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#F3F4F6", color: "#6B7280", fontSize: 16, cursor: "pointer", padding: 0 }}>×</button>
        </div>

        {step === "intro" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", textAlign: "center", paddingTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1E1E24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="30" height="22" viewBox="0 0 64 44" fill="none"><path d="M8 40 A28 28 0 0 1 56 40" stroke="#2E2E37" strokeWidth="7" strokeLinecap="round" /><path d="M8 40 A28 28 0 0 1 44 14.6" stroke="#3DDC97" strokeWidth="7" strokeLinecap="round" /><line x1="32" y1="40" x2="14" y2="26" stroke="#F2F2F5" strokeWidth="3.5" strokeLinecap="round" /></svg>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14 M13 6l6 6-6 6" /></svg>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111214" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18 M3 6l9-4 9 4 M5 10v8 M9 10v8 M15 10v8 M19 10v8 M2 21h20" /></svg>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, maxWidth: 280 }}>BudgetLock uses Plaid to connect your account</div>
            <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.55, maxWidth: 280, marginTop: 10 }}>Your credentials are never shared with BudgetLock. {plaidConfigured ? "This is a sandbox demo — no real bank is contacted." : "This is a demo — no real bank is contacted."}</div>
            <div style={{ flex: 1 }} />
            <button onClick={() => setStep("banks")} className="press" style={darkBtn}>Continue</button>
          </div>
        )}

        {step === "banks" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, paddingBottom: 14 }}>Select your bank</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {BANKS.map((b) => (
                <button key={b.name} onClick={() => { setBank(b.name); setStep("creds"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: b.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{b.initials}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111214" }}>{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "creds" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Log in to {bank}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, paddingBottom: 18 }}>Sandbox: any credentials work</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} style={{ height: 48, borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", color: "#111214", fontSize: 15, padding: "0 14px", fontFamily: "inherit" }} />
              <input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ height: 48, borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", color: "#111214", fontSize: 15, padding: "0 14px", fontFamily: "inherit" }} />
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={submit} disabled={!user || !pass} className="press" style={{ ...darkBtn, opacity: user && pass ? 1 : 0.4 }}>Submit</button>
          </div>
        )}

        {step === "connecting" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#111214" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "bl-spin 900ms linear infinite" }}><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Connecting to {bank}…</div>
          </div>
        )}

        {step === "success" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", textAlign: "center", paddingTop: 34 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(61,220,151,0.15)", display: "flex", alignItems: "center", justifyContent: "center", animation: "bl-rise 350ms ease-out" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>Account connected</div>
            <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.55, maxWidth: 280, marginTop: 8 }}>{bank} checking is linked. {imported} new transaction{imported === 1 ? "" : "s"} {imported === 1 ? "was" : "were"} imported.</div>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} className="press" style={darkBtn}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}
