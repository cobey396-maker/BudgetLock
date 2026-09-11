"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "@/lib/types";
import { AppCtx, useCtx, type Ctx, type Screen } from "./ctx";
import DeviceShell from "./ui/DeviceShell";
import AuthScreen from "./screens/AuthScreen";
import Questionnaire from "./screens/Questionnaire";
import Onboarding from "./screens/Onboarding";
import MainApp from "./screens/MainApp";

export default function App({
  initial,
  plaidConfigured,
}: {
  initial: AppState | null;
  plaidConfigured: boolean;
}) {
  const [state, setState] = useState<AppState | null>(initial);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);
  const [detailTxn, setDetailTxn] = useState<AppState["transactions"][number] | null>(null);

  // gauge animation
  const [gaugeOn, setGaugeOn] = useState(false);
  const [dispSpent, setDispSpent] = useState(0);
  const revTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);
  const spentTarget = useRef<number | null>(null);

  const rev = useCallback(() => {
    if (revTimer.current) clearTimeout(revTimer.current);
    setGaugeOn(false);
    revTimer.current = setTimeout(() => setGaugeOn(true), 90);
  }, []);

  // Tween the big spent number toward its target.
  const tweenSpent = useCallback((target: number) => {
    if (spentTarget.current === target) return;
    spentTarget.current = target;
    if (raf.current) cancelAnimationFrame(raf.current);
    const from = dispSpent || 0;
    const start = performance.now();
    const dur = 1000;
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDispSpent(from + (target - from) * e);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kick the gauge on first load into the main app.
  useEffect(() => {
    rev();
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (revTimer.current) clearTimeout(revTimer.current);
    };
  }, [rev]);

  // Retarget the spent tween whenever the summary changes.
  useEffect(() => {
    if (state?.summary) tweenSpent(state.summary.spent);
  }, [state?.summary, tweenSpent]);

  // Keypad entry (ported from the prototype: max 6 non-dot chars, 2 decimals).
  const keyTap = useCallback((k: string) => {
    setEntry((prev) => {
      let e = prev;
      if (k === "⌫") e = e.slice(0, -1);
      else if (k === ".") {
        if (!e.includes(".")) e = (e || "0") + ".";
      } else {
        if (e.includes(".") && e.split(".")[1].length >= 2) return e;
        if (e.replace(".", "").length >= 6) return e;
        e = e === "0" ? k : e + k;
      }
      return e;
    });
  }, []);

  const ctx: Ctx | null = state
    ? {
        state,
        setState,
        plaidConfigured,
        screen,
        setScreen,
        entry,
        setEntry,
        keyTap,
        gaugeOn,
        dispSpent,
        rev,
        busy,
        setBusy,
        detailTxn,
        setDetailTxn,
      }
    : null;

  // ── phase routing (mirrors showAccount / showProfile / showOnboard / showMain) ──
  const glowColor = state?.summary.over
    ? "rgba(255,107,107,0.16)"
    : state?.summary.warn
      ? "rgba(232,179,75,0.13)"
      : "rgba(61,220,151,0.11)";

  return (
    <DeviceShell glowColor={glowColor}>
      {!state ? (
        <AuthScreen onAuthed={setState} />
      ) : (
        <AppCtx.Provider value={ctx!}>
          <Phase />
        </AppCtx.Provider>
      )}
    </DeviceShell>
  );
}


function Phase() {
  const { state } = useCtx();
  const { account, profile, budget } = state;
  if (!account) return null; // signed-out state is handled in App
  if (!profile.profileDone && !budget.setup) return <Questionnaire />;
  if (profile.profileDone && !budget.setup) return <Onboarding />;
  return <MainApp />;
}
