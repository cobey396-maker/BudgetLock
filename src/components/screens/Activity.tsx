"use client";
import type { AppState } from "@/lib/types";
import { useCtx, money } from "../ctx";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { periodTxns, catOf, type StoredTxn } from "@/lib/budget";

export default function Activity() {
  const { state, setState, setDetailTxn } = useCtx();
  const sum = state.summary;
  const txns = periodTxns(state.transactions, sum.period);

  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const iconFor = (t: StoredTxn) => categoryById(catOf(t))?.icon || "M12 8v8 M8 12h8";

  const sorted = [...txns].sort((a, b) => (a.date < b.date ? 1 : -1));
  const groups: { dateLabel: string; items: StoredTxn[] }[] = [];
  for (const t of sorted) {
    const label =
      t.date === today ? "Today" : t.date === yest ? "Yesterday" : new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let g = groups.find((x) => x.dateLabel === label);
    if (!g) {
      g = { dateLabel: label, items: [] };
      groups.push(g);
    }
    g.items.push(t);
  }

  async function remove(id: string) {
    const st = (await api.removeTxn(id)) as AppState;
    setState(st);
  }

  return (
    <div data-screen-label="Activity" style={{ flex: 1, overflow: "auto", padding: "8px 18px 20px", display: "flex", flexDirection: "column", gap: 4, animation: "bl-screen 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 2px 14px" }}>
        <span className="font-grotesk" style={{ fontSize: 24, fontWeight: 700 }}>Activity</span>
        <span className="tnum" style={{ fontSize: 13, color: C.textMuted }}>{money(sum.spent)} this {sum.periodWord}</span>
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "40px 0" }}>No transactions this {sum.periodWord} yet.</div>
      )}

      {groups.map((g, gi) => (
        <div key={g.dateLabel} style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14, animation: "bl-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: gi * 80 + "ms" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: C.textMuted, padding: "0 2px 8px" }}>{g.dateLabel}</div>
          <div style={{ background: C.surface2, borderRadius: 18, overflow: "hidden" }}>
            {g.items.map((t) => {
              const cat = CATEGORIES.find((x) => x.id === catOf(t));
              return (
                <div key={t.transactionId} onClick={() => setDetailTxn(t)} className="txn-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A9A9B4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconFor(t)} /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.merchantName || t.name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{(cat ? cat.label : "Untracked") + (t.pending ? " · Pending" : "")}</div>
                  </div>
                  <div className="font-grotesk tnum" style={{ fontSize: 15, fontWeight: 600, flexShrink: 0 }}>−{money(t.amount, true)}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(t.transactionId);
                    }}
                    aria-label="Delete transaction"
                    className="del-btn"
                    style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "transparent", color: C.textFaint, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
