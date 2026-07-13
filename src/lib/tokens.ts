// BudgetLock design tokens — mirrors README "Design Tokens" + the prototype.
export const C = {
  bg: "#17171C",
  bgDeep: "#131318",
  surface: "#1E1E24",
  surface2: "#26262E",
  surface3: "#2E2E37",
  surface3b: "#33333d",
  surface3d: "#33333D",
  border: "rgba(255,255,255,0.08)",
  text: "#F2F2F5",
  textSecondary: "#C9C9D1",
  textMuted: "#8B8B96",
  textMuted2: "#A9A9B4",
  textFaint: "#55555F",
  navIdle: "#71717C",
  mint: "#3DDC97",
  mintBright: "#5FF0B6",
  mintDeep: "#2BC286",
  onMint: "#10251C",
  mintTintBg: "rgba(61,220,151,0.14)",
  mintTintBorder: "rgba(61,220,151,0.6)",
  amber: "#E8B34B",
  amberSpec: "#FFB020",
  coral: "#FF6B6B",
  red: "#FF5C5C",
} as const;

export const CTA_GRADIENT = "linear-gradient(135deg, #5FF0B6 0%, #2BC286 100%)";
export const CTA_SHADOW = "0 6px 20px rgba(61,220,151,0.25)";
export const PROGRESS_GRADIENT = "linear-gradient(90deg, #2BC286, #5FF0B6)";

// Status thresholds. README backend prose says 75% warn / 100% locked; the
// working prototype (and screenshots) use 0.8. We keep the prototype's value
// as the single source of truth so the gauge matches the reference exactly.
export const WARN_AT = 0.8;
export const LOCK_AT = 1.0;
