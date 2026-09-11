"use client";
import type { ReactNode } from "react";
import { C } from "@/lib/tokens";
import { Glow, HomeIndicator, StatusBar } from "./primitives";

const MINT_GLOW = "rgba(61,220,151,0.11)";

/**
 * The phone frame every screen sits in. Extracted so the pages reached from an
 * email link (`/reset`, `/verify`) look like the app rather than a bare web
 * page dropped in front of someone mid-recovery.
 */
export default function DeviceShell({
  children,
  glowColor = MINT_GLOW,
}: {
  children: ReactNode;
  glowColor?: string;
}) {
  return (
    <div className="device-stage">
      <div className="device" style={{ background: C.surface }}>
        <StatusBar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            paddingTop: 58,
            position: "relative",
            isolation: "isolate",
            overflow: "hidden",
            color: C.text,
          }}
        >
          <Glow color={glowColor} />
          {children}
        </div>
        <HomeIndicator />
      </div>
    </div>
  );
}
