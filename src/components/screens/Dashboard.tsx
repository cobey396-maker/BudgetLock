"use client";
import { useCtx, money } from "../ctx";
import { C } from "@/lib/tokens";
import { weekStartIso } from "@/lib/budget";
import Gauge from "../ui/Gauge";

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "8px 18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  animation: "bl-screen 420ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export default function Dashboard() {
  const { state, gaugeOn, dispSpent } = useCtx();
  const sum = state.summary;
  const weekly = sum.period === "weekly";
  const accent = sum.over ? C.coral : sum.warn ? C.amber : C.mint;

  const monthLabel = weekly
    ? "Week of " + new Date(weekStartIso() + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const statusText = sum.over ? "OVER REDLINE" : sum.warn ? "REDLINE AHEAD" : "CRUISING";
  const remainingLine = sum.over
    ? money(sum.spent - sum.limit) + " over your limit this " + sum.periodWord
    : money(sum.limit - sum.spent) + " left this " + sum.periodWord;

  const bannerTitle = sum.over ? "You’re over the redline" : "Redline ahead";
  const bannerBody = sum.over
    ? money(sum.spent - sum.limit) + " past your " + money(sum.limit) + " limit. Ease off the pedal."
    : "You’ve used " + Math.round(sum.pct * 100) + "% of your " + (weekly ? "weekly" : "monthly") + " limit.";

  const statusBg = sum.over ? "rgba(255,107,107,0.12)" : sum.warn ? "rgba(232,179,75,0.12)" : "rgba(61,220,151,0.1)";

  return (
    <div data-screen-label="Dashboard" style={scrollStyle}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="26" height="19" viewBox="0 0 64 44" fill="none">
            <path d="M8 40 A28 28 0 0 1 56 40" stroke="#2E2E37" strokeWidth="8" strokeLinecap="round" />
            <path d="M8 40 A28 28 0 0 1 44 14.6" stroke={accent} strokeWidth="8" strokeLinecap="round" />
            <line x1="32" y1="40" x2="14" y2="26" stroke="#F2F2F5" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className="font-grotesk" style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.3px" }}>BudgetLock</span>
        </div>
        <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{monthLabel}</span>
      </div>

      {(sum.warn || sum.over) && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 16, background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.35)", animation: "bl-rise 300ms ease-out" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, animation: "bl-pulse 1.6s ease-in-out infinite" }}>
            <path d="M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FF6B6B" }}>{bannerTitle}</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 1 }}>{bannerBody}</div>
          </div>
        </div>
      )}

      {/* Gauge card */}
      <div
        style={{
          background: "linear-gradient(180deg, #2B2B34 0%, #232329 100%)",
          borderRadius: 24,
          padding: "18px 16px 20px",
          border: `1px solid ${sum.over ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.05)"}`,
          boxShadow: sum.over ? "0 0 40px rgba(255,107,107,0.15)" : "none",
          transition: "border-color 600ms, box-shadow 600ms",
        }}
      >
        <Gauge pct={sum.pct} gaugeOn={gaugeOn} dispSpent={dispSpent} limit={sum.limit} status={sum.status} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2, padding: "0 6px" }}>
          <span className="tnum" style={{ fontSize: 12, color: C.textFaint }}>$0</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999, background: statusBg, transition: "background 600ms" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, animation: sum.over ? "bl-pulse 1.4s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: accent }}>{statusText}</span>
          </div>
          <span className="tnum" style={{ fontSize: 12, color: sum.over ? C.coral : C.textFaint }}>{money(sum.limit)}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 14, color: sum.over ? C.coral : C.textMuted, marginTop: 14, fontWeight: 500 }}>{remainingLine}</div>
      </div>

      {/* Categories */}
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: C.textMuted, padding: "4px 2px 0" }}>Categories</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sum.categories.map((c, ci) => {
          const color = c.over ? C.coral : c.warn ? C.amber : C.mint;
          const iconBg = c.over ? "rgba(255,107,107,0.14)" : c.warn ? "rgba(232,179,75,0.14)" : "rgba(61,220,151,0.12)";
          const barFrom = c.over ? "#E05252" : c.warn ? "#D9A43C" : "#2BC286";
          const barTo = c.over ? "#FF9B9B" : c.warn ? "#F7D06B" : "#6CF0BC";
          const rightLabel = c.over ? money(c.spent - c.limit) + " over" : money(c.limit - c.spent) + " left";
          return (
            <div key={c.id} style={{ background: C.surface2, borderRadius: 18, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, animation: "bl-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: ci * 70 + "ms" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{c.label}</div>
                  <div className="tnum" style={{ fontSize: 12.5, color: C.textMuted, marginTop: 1 }}>{money(c.spent, true)} of {money(c.limit)}</div>
                </div>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 600, color, flexShrink: 0 }}>{rightLabel}</div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#33333D", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${barFrom}, ${barTo})`, width: Math.min(c.pct, 1) * 100 + "%", transition: "width 900ms cubic-bezier(0.22, 1, 0.36, 1)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))", animation: "bl-shimmer 2.8s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
