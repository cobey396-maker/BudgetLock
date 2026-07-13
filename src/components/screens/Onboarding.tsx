"use client";
import { useEffect, useRef, useState } from "react";
import type { AppState } from "@/lib/types";
import { useCtx, money } from "../ctx";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CATEGORIES } from "@/lib/categories";
import { defaultCatLimit } from "@/lib/budget";
import { CTA, Keypad, LogoMark } from "../ui/primitives";

const screenStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "12px 22px 40px",
  overflow: "auto",
  animation: "bl-screen 500ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export default function Onboarding() {
  const { state } = useCtx();
  return state.budget.onboardStep === 0 ? <LimitStep /> : <SplitStep />;
}

function LimitStep() {
  const { state, setState, entry, setEntry, keyTap, busy, setBusy } = useCtx();
  const weekly = state.budget.period === "weekly";
  const div = weekly ? 4 : 1;
  const entryVal = parseFloat(entry) || 0;
  const hasSuggest = state.profile.suggestedLimit > 0 && entry === String(state.profile.suggestedLimit);

  // Ensure the suggestion is prefilled on mount / reload.
  useEffect(() => {
    if (entry === "" && state.profile.suggestedLimit > 0) setEntry(String(state.profile.suggestedLimit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cont() {
    if (entryVal <= 0 || busy) return;
    setBusy(true);
    const lim = entryVal * div;
    const cl: Record<string, number> = {};
    CATEGORIES.forEach((c) => (cl[c.id] = defaultCatLimit(lim, c)));
    try {
      const st = (await api.budget({ monthlyLimit: lim, categoryLimits: cl, onboardStep: 1 })) as AppState;
      setState(st);
      setEntry("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-screen-label="Limit setup" style={screenStyle}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0 30px" }}>
        <LogoMark />
        <div className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>BudgetLock</div>
        <div style={{ fontSize: 15, color: C.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: 260 }}>
          Set a monthly limit. Watch the needle. Stay out of the red.
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: C.textMuted, textAlign: "center" }}>
        {weekly ? "Weekly spending limit" : "Monthly spending limit"}
      </div>
      <div className="font-grotesk tnum" style={{ fontSize: 52, fontWeight: 700, textAlign: "center", padding: "10px 0 8px", color: entry ? C.text : C.textFaint }}>
        {entry ? "$" + entry : "$0"}
      </div>
      {hasSuggest && (
        <div style={{ textAlign: "center", fontSize: 12.5, color: C.mint, paddingBottom: 12 }}>
          Suggested from your income, bills &amp; savings goal
        </div>
      )}

      <Keypad onKey={keyTap} keySize={54} />
      <div style={{ flex: 1 }} />
      <CTA onClick={cont} disabled={entryVal <= 0 || busy} style={{ marginTop: 18 }}>Continue</CTA>
    </div>
  );
}

function SplitStep() {
  const { state, setState, rev, busy, setBusy } = useCtx();
  const weekly = state.budget.period === "weekly";
  const div = weekly ? 4 : 1;
  const limit = (state.budget.monthlyLimit || 2000) / div;

  // Local draft of per-category limits (period-adjusted values shown to user).
  const [vals, setVals] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      const monthly = state.budget.categoryLimits[c.id] ?? defaultCatLimit(state.budget.monthlyLimit || 2000, c);
      v[c.id] = monthly / div;
    });
    return v;
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persist = (next: Record<string, number>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const monthly: Record<string, number> = {};
      CATEGORIES.forEach((c) => (monthly[c.id] = Math.round(next[c.id] * div)));
      const st = (await api.budget({ categoryLimits: monthly })) as AppState;
      setState(st);
    }, 500);
  };

  const setVal = (id: string, raw: number) => {
    const v = Math.max(0, raw);
    const next = { ...vals, [id]: v };
    setVals(next);
    persist(next);
  };

  const allocated = CATEGORIES.reduce((a, c) => a + (vals[c.id] || 0), 0);
  const over = allocated > limit;

  async function start() {
    if (busy) return;
    setBusy(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const monthly: Record<string, number> = {};
    CATEGORIES.forEach((c) => (monthly[c.id] = Math.round((vals[c.id] || 0) * div)));
    try {
      const st = (await api.budget({ categoryLimits: monthly, setup: true })) as AppState;
      setState(st);
      rev();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-screen-label="Category split" style={screenStyle}>
      <div className="font-grotesk" style={{ padding: "14px 0 6px", fontSize: 26, fontWeight: 700 }}>Split your limit</div>
      <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, paddingBottom: 22 }}>
        Give each category its own redline. You can change these anytime.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {CATEGORIES.map((c) => {
          const val = vals[c.id] || 0;
          const fill = limit > 0 ? Math.min((val / limit) * 100, 100) : 0;
          return (
            <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.mint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.icon} />
                </svg>
                <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{c.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 10px" }}>
                  <span className="font-grotesk" style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>$</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={Math.round(val)}
                    onChange={(e) => setVal(c.id, Math.max(0, +e.target.value || 0))}
                    className="font-grotesk tnum"
                    style={{ width: 62, height: 34, border: "none", background: "transparent", color: C.text, fontSize: 16, fontWeight: 600, textAlign: "right", padding: 0 }}
                  />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(limit, 10)}
                step={10}
                value={Math.min(val, limit)}
                onChange={(e) => setVal(c.id, +e.target.value)}
                style={{ width: "100%", ["--fill" as string]: fill + "%" }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 14, background: C.surface2, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <span style={{ color: C.textMuted }}>Allocated</span>
        <span className="font-grotesk tnum" style={{ fontWeight: 600, color: over ? C.coral : C.mint }}>
          {money(allocated)} of {money(limit)}
        </span>
      </div>

      <div style={{ flex: 1 }} />
      <CTA onClick={start} disabled={busy} style={{ marginTop: 18 }}>Start driving</CTA>
    </div>
  );
}
