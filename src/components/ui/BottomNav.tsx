"use client";
import { useCtx } from "../ctx";
import { C } from "@/lib/tokens";

export default function BottomNav() {
  const { screen, setScreen, setEntry, state, rev } = useCtx();
  const { status } = state.summary;
  const accent = status === "over" ? C.coral : status === "warn" ? C.amber : C.mint;
  const fabBg =
    status === "over"
      ? "linear-gradient(145deg, #FF9B9B, #E05252)"
      : status === "warn"
        ? "linear-gradient(145deg, #F7D06B, #D9A43C)"
        : "linear-gradient(145deg, #5FF0B6 0%, #2BC286 100%)";
  const fabGlow =
    status === "over" ? "rgba(255,107,107,0.32)" : status === "warn" ? "rgba(232,179,75,0.3)" : "rgba(61,220,151,0.28)";

  const tint = (active: boolean) => (active ? accent : C.navIdle);

  const NavBtn = ({ id, label, icon }: { id: "dashboard" | "activity" | "limits" | "settings"; label: string; icon: React.ReactNode }) => {
    const active = screen === id;
    return (
      <button
        onClick={() => {
          setScreen(id);
          if (id === "dashboard") rev();
        }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 14px", minWidth: 64 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ transition: "stroke 300ms" }} stroke={tint(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
        <span style={{ fontSize: 10.5, fontWeight: 600, transition: "color 300ms", color: tint(active) }}>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 12px 12px", background: "rgba(24,24,29,0.96)", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
      <NavBtn id="dashboard" label="Gauge" icon={<path d="M12 15 15.5 11.5 M20.3 18a9 9 0 1 0-16.6 0" />} />
      <NavBtn id="activity" label="Activity" icon={<path d="M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01" />} />
      <button
        onClick={() => {
          setEntry("");
          setScreen("add");
        }}
        aria-label="Add transaction"
        className="press-sm"
        style={{ width: 54, height: 54, borderRadius: "50%", border: "none", background: fabBg, color: C.onMint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 26px ${fabGlow}, 0 4px 12px rgba(0,0,0,0.35)`, padding: 0, transition: "transform 150ms ease" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.onMint} strokeWidth="2.5" strokeLinecap="round" style={{ display: "block" }}>
          <path d="M12 5v14 M5 12h14" />
        </svg>
      </button>
      <NavBtn id="limits" label="Limits" icon={<path d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1.5 14h5 M9.5 8h5 M17.5 16h5" />} />
      <NavBtn id="settings" label="Settings" icon={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} />
    </div>
  );
}
