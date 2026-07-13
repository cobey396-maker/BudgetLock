"use client";
import type { AppState } from "@/lib/types";
import { useCtx, money } from "../ctx";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { categoryById } from "@/lib/categories";
import { catOf } from "@/lib/budget";

export default function TxnDetail() {
  const { detailTxn, setDetailTxn, setState } = useCtx();
  if (!detailTxn) return null;
  const t = detailTxn;
  const cat = categoryById(catOf(t));
  const icon = cat?.icon || "M12 8v8 M8 12h8";
  const date = new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  async function remove() {
    setDetailTxn(null);
    const st = (await api.removeTxn(t.transactionId)) as AppState;
    setState(st);
  }

  const InfoRow = ({ label, value, color, border = true }: { label: string; value: string; color?: string; border?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", borderBottom: border ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: 13.5 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? C.text }}>{value}</span>
    </div>
  );

  return (
    <div onClick={() => setDetailTxn(null)} style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 26, background: "rgba(19,19,24,0.45)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", animation: "bl-fade 220ms ease-out" }}>
      <div onClick={(e) => e.stopPropagation()} data-screen-label="Transaction detail" style={{ width: "100%", height: "50%", background: "linear-gradient(180deg, #2B2B34 0%, #232329 100%)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 26, padding: "22px 22px 20px", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", animation: "bl-rise 320ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A9A9B4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.merchantName || t.name}</div>
          <button onClick={() => setDetailTxn(null)} aria-label="Close" className="press-sm" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.07)", color: C.textMuted2, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>×</button>
        </div>
        <div style={{ textAlign: "center", padding: "18px 0 4px" }}>
          <div className="font-grotesk tnum" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-1px" }}>−{money(t.amount, true)}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{date}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 16, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
          <InfoRow label="Category" value={cat ? cat.label : "Untracked"} />
          <InfoRow label="Channel" value={t.paymentChannel === "online" ? "Online" : "In store"} />
          <InfoRow label="Status" value={t.pending ? "Pending" : "Posted"} color={t.pending ? C.amber : C.mint} border={false} />
        </div>
        <button onClick={remove} className="press" style={{ height: 44, borderRadius: 14, border: "1px solid rgba(255,107,107,0.35)", background: "transparent", color: C.coral, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Delete transaction</button>
      </div>
    </div>
  );
}
