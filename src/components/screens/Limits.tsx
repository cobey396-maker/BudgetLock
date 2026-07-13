"use client";
import type { AppState } from "@/lib/types";
import { useCtx, money } from "../ctx";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CATEGORIES } from "@/lib/categories";
import { defaultCatLimit } from "@/lib/budget";

export default function Limits() {
  const { state, setState } = useCtx();
  const b = state.budget;
  const weekly = b.period === "weekly";
  const div = weekly ? 4 : 1;
  const limit = (b.monthlyLimit || 2000) / div;

  const catMonthly = (id: string) => {
    const c = CATEGORIES.find((x) => x.id === id)!;
    return b.categoryLimits[id] ?? defaultCatLimit(b.monthlyLimit || 2000, c);
  };

  async function setMonthly(v: number) {
    const st = (await api.budget({ monthlyLimit: Math.max(100, v) })) as AppState;
    setState(st);
  }
  async function stepCat(id: string, d: number) {
    const next = { ...b.categoryLimits };
    CATEGORIES.forEach((c) => {
      if (next[c.id] === undefined) next[c.id] = catMonthly(c.id);
    });
    next[id] = Math.max(0, catMonthly(id) + d * div);
    const st = (await api.budget({ categoryLimits: next })) as AppState;
    setState(st);
  }

  const StepBtn = ({ label, onClick, sz = 44, r = 14, fs = 22 }: { label: string; onClick: () => void; sz?: number; r?: number; fs?: number }) => (
    <button onClick={onClick} aria-label={label === "−" ? "Decrease" : "Increase"} className="press-sm" style={{ width: sz, height: sz, borderRadius: r, border: "none", background: "#33333D", color: C.text, fontSize: fs, cursor: "pointer", padding: 0 }}>{label}</button>
  );

  return (
    <div data-screen-label="Limits" style={{ flex: 1, overflow: "auto", padding: "8px 18px 20px", display: "flex", flexDirection: "column", gap: 14, animation: "bl-screen 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
      <div className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, padding: "4px 2px 2px" }}>Limits</div>

      <div style={{ background: C.surface2, borderRadius: 18, padding: "18px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>{weekly ? "Weekly limit" : "Monthly limit"}</div>
          <div className="font-grotesk tnum" style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{money(limit)}</div>
        </div>
        <StepBtn label="−" onClick={() => setMonthly(b.monthlyLimit - 100 * div)} />
        <StepBtn label="+" onClick={() => setMonthly(b.monthlyLimit + 100 * div)} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: C.textMuted, padding: "6px 2px 0" }}>Category limits</div>
      <div style={{ background: C.surface2, borderRadius: 18, overflow: "hidden" }}>
        {CATEGORIES.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A9A9B4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={c.icon} /></svg>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{c.label}</div>
            <div className="font-grotesk tnum" style={{ fontSize: 16, fontWeight: 600, minWidth: 62, textAlign: "right" }}>{money(catMonthly(c.id) / div)}</div>
            <StepBtn label="−" onClick={() => stepCat(c.id, -25)} sz={38} r={12} fs={19} />
            <StepBtn label="+" onClick={() => stepCat(c.id, 25)} sz={38} r={12} fs={19} />
          </div>
        ))}
      </div>
    </div>
  );
}
