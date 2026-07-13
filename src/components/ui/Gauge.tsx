"use client";
import { money } from "../ctx";
import { C } from "@/lib/tokens";
import { GAUGE, ARC_LEN, arcPath, polar, pctToDeg } from "@/lib/budget";

const REDLINE_START = 0.85;

export default function Gauge({
  pct,
  gaugeOn,
  dispSpent,
  limit,
  status,
}: {
  pct: number;
  gaugeOn: boolean;
  dispSpent: number;
  limit: number;
  status: "cruising" | "warn" | "over";
}) {
  const accent = status === "over" ? C.coral : status === "warn" ? C.amber : C.mint;
  const gradId = status === "over" ? "blGradCoral" : status === "warn" ? "blGradAmber" : "blGradMint";
  const needleGlow =
    status === "over" ? "rgba(255,107,107,0.5)" : status === "warn" ? "rgba(232,179,75,0.45)" : "rgba(61,220,151,0.4)";

  const gaugePct = gaugeOn ? pct : 0;
  const needleDeg = Math.min(Math.max(gaugePct, 0), 1.06) * 240;
  const progressDash = `${(Math.min(gaugePct, 1) * ARC_LEN).toFixed(1)} ${ARC_LEN.toFixed(1)}`;

  const ticks = [];
  for (let i = 0; i <= 20; i++) {
    const p = i / 20;
    const deg = pctToDeg(p);
    const major = i % 5 === 0;
    const a = polar(deg, major ? 88 : 94);
    const b = polar(deg, 100);
    ticks.push({
      x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1),
      color: p >= REDLINE_START ? "rgba(255,107,107,0.8)" : "rgba(255,255,255,0.18)",
      w: major ? 2.5 : 1.5,
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 300 212" style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="blGradMint" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2BC286" /><stop offset="100%" stopColor="#6CF0BC" />
          </linearGradient>
          <linearGradient id="blGradCoral" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E05252" /><stop offset="100%" stopColor="#FF9B9B" />
          </linearGradient>
          <linearGradient id="blGradAmber" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9A43C" /><stop offset="100%" stopColor="#F7D06B" />
          </linearGradient>
        </defs>
        <path d={arcPath(210, -30, GAUGE.r)} stroke="#33333D" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d={arcPath(pctToDeg(REDLINE_START), -30, GAUGE.r)} stroke="rgba(255,107,107,0.4)" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path
          d={arcPath(210, -30, GAUGE.r)}
          stroke={`url(#${gradId})`}
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={progressDash}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke 600ms" }}
        />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.color} strokeWidth={t.w} strokeLinecap="round" />
        ))}
        <g
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transformOrigin: "150px 152px",
            transition: "transform 1100ms cubic-bezier(0.34, 1.3, 0.5, 1)",
            filter: `drop-shadow(0 0 7px ${needleGlow})`,
          }}
        >
          <line x1="150" y1="152" x2="76" y2="195" stroke="#F2F2F5" strokeWidth="4" strokeLinecap="round" />
          <line x1="88" y1="188" x2="76" y2="195" stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
        </g>
        <circle cx="150" cy="152" r="9" fill="#1E1E24" stroke="#F2F2F5" strokeWidth="3" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: "34%", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
        <div className="font-grotesk tnum" style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1 }}>
          {money(Math.max(0, dispSpent))}
        </div>
        <div className="tnum" style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
          of {money(limit)} · {Math.round(pct * 100)}%
        </div>
      </div>
    </div>
  );
}
