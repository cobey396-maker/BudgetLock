"use client";
import React from "react";
import { C, CTA_GRADIENT, CTA_SHADOW } from "@/lib/tokens";

// Primary CTA — 54px, radius 27px, mint gradient (README §1).
export function CTA({
  children,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      className="press font-grotesk"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 54,
        borderRadius: 27,
        border: "none",
        background: CTA_GRADIENT,
        boxShadow: CTA_SHADOW,
        color: C.onMint,
        fontSize: 17,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        transition: "transform 150ms ease, opacity 400ms",
        opacity: disabled ? 0.35 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Text input — 50-52px, surface-2 bg, radius 14px (README §1).
export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        height: 50,
        borderRadius: 14,
        border: `1px solid ${invalid ? "rgba(255,107,107,0.5)" : C.border}`,
        background: C.surface2,
        color: C.text,
        fontSize: 15,
        padding: "0 16px",
        fontFamily: "inherit",
        transition: "border-color 200ms",
        ...style,
      }}
    />
  );
}

// 3×4 numeric keypad (README §2). keySize: 52 (questionnaire) or 54 (limit).
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];
export function Keypad({ onKey, keySize = 52 }: { onKey: (k: string) => void; keySize?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
      {KEYS.map((k) => (
        <button
          key={k}
          className="press-key font-grotesk"
          onClick={() => onKey(k)}
          style={{
            height: keySize,
            borderRadius: 14,
            border: "none",
            background: C.surface2,
            color: C.text,
            fontSize: keySize > 52 ? 22 : 21,
            fontWeight: 500,
            cursor: "pointer",
            transition: "transform 120ms ease, background 120ms ease",
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

export type ChipSpec = { label: string; selected: boolean; onClick: () => void; icon?: string };

// Pill chip (README §2). `big` = questionnaire padding (12×17), else compact.
export function Chip({ spec, big = true }: { spec: ChipSpec; big?: boolean }) {
  const sel = spec.selected;
  return (
    <button
      className="press-chip"
      onClick={spec.onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spec.icon ? 7 : 0,
        padding: big ? "12px 17px" : "9px 14px",
        borderRadius: 999,
        border: `1px solid ${sel ? C.mintTintBorder : C.border}`,
        background: sel ? C.mintTintBg : C.surface2,
        color: sel ? C.mint : C.textSecondary,
        fontSize: big ? 14 : 13.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "transform 120ms ease",
      }}
    >
      {spec.icon && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={spec.icon} />
        </svg>
      )}
      {spec.label}
    </button>
  );
}

// The animated radial glow behind every screen (color reflects status).
export function Glow({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -70,
        left: "50%",
        width: 360,
        height: 360,
        marginLeft: -180,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, rgba(30,30,36,0) 68%)`,
        pointerEvents: "none",
        animation: "bl-breathe 6s ease-in-out infinite",
        zIndex: -1,
      }}
    />
  );
}

// Animated BudgetLock logo mark (speedometer needle revs up).
export function LogoMark({ w = 64, h = 44, accent = C.mint, animate = true }: { w?: number; h?: number; accent?: string; animate?: boolean }) {
  return (
    <svg width={w} height={h} viewBox="0 0 64 44" fill="none">
      <path d="M8 40 A28 28 0 0 1 56 40" stroke="#2E2E37" strokeWidth="7" strokeLinecap="round" />
      <path d="M8 40 A28 28 0 0 1 44 14.6" stroke={accent} strokeWidth="7" strokeLinecap="round" />
      <g style={{ transformOrigin: "32px 40px", animation: animate ? "bl-rev 1.4s cubic-bezier(0.34, 1.2, 0.4, 1) both" : undefined }}>
        <line x1="32" y1="40" x2="14" y2="26" stroke="#F2F2F5" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="40" r="4" fill="#F2F2F5" />
    </svg>
  );
}

// iOS-style status bar at the top of the device frame.
export function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        fontSize: 15,
        fontWeight: 600,
        color: C.text,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <span className="font-grotesk">9:41</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={C.text}><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 12" fill={C.text}><path d="M8 2.2c2 0 3.8.8 5.1 2l1-1.1A9 9 0 0 0 8 .5 9 9 0 0 0 1.9 3l1 1.1A7.4 7.4 0 0 1 8 2.2Zm0 3c1.2 0 2.3.5 3.1 1.2l1-1.1A5.9 5.9 0 0 0 8 3.7 5.9 5.9 0 0 0 3.9 5.3l1 1.1A4.4 4.4 0 0 1 8 5.2Zm0 3c.6 0 1.2.2 1.6.7L8 10.5 6.4 8.9c.4-.5 1-.7 1.6-.7Z"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={C.text} opacity="0.4"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill={C.text}/><rect x="23" y="4" width="1.5" height="4" rx="0.75" fill={C.text} opacity="0.4"/></svg>
      </span>
    </div>
  );
}

// Home indicator bar at bottom of the frame.
export function HomeIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 8px", flexShrink: 0 }}>
      <div style={{ width: 134, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.3)" }} />
    </div>
  );
}
