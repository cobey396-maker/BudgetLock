"use client";
import { useEffect, useState } from "react";
import type { AppState } from "@/lib/types";
import { useCtx } from "../ctx";
import { api } from "@/lib/client";
import { C, PROGRESS_GRADIENT } from "@/lib/tokens";
import { CTA, Keypad, Chip, type ChipSpec } from "../ui/primitives";

type Step = {
  key: "wage" | "savingsGoal" | "expenses" | "age" | null;
  title: string;
  sub: string;
  keypad?: boolean;
  money?: boolean;
  time?: boolean;
  chips?: "goals" | "assets";
};

const STEPS: Step[] = [
  { key: "wage", title: "How much do you make?", sub: "Monthly take-home pay, after taxes. It anchors a limit you can actually keep.", keypad: true, money: true },
  { key: "savingsGoal", title: "What’s your savings goal?", sub: "A number you’re driving toward — and when you want to arrive.", keypad: true, money: true, time: true },
  { key: "expenses", title: "What are your fixed expenses?", sub: "Rent, utilities, insurance — the bills that hit every month no matter what.", keypad: true, money: true },
  { key: null, title: "Any long-term goals?", sub: "Where the money is ultimately headed. Pick all that apply.", chips: "goals" },
  { key: "age", title: "How old are you?", sub: "Sets the pace — saving for a house at 22 looks different than at 42.", keypad: true, money: false },
  { key: null, title: "Investments & assets?", sub: "Anything already working for you. Pick all that apply.", chips: "assets" },
];

const GOAL_OPTS = ["House", "Car", "Travel", "Retire early", "Wedding", "Emergency fund", "None yet"];
const ASSET_OPTS = ["Stocks", "Crypto", "401(k) / IRA", "Real estate", "Savings account", "None yet"];
const TIME_CHIPS = [
  { l: "3 months", m: 3 },
  { l: "6 months", m: 6 },
  { l: "1 year", m: 12 },
  { l: "2 years", m: 24 },
  { l: "5 years", m: 60 },
];

export default function Questionnaire() {
  const { state, setState, entry, setEntry, keyTap, setBusy, busy } = useCtx();
  const [step, setStep] = useState(state.profile.profileStep || 0);
  // Local draft of chip/time answers (keypad answers live in `entry`).
  const [goals, setGoals] = useState<string[]>(state.profile.goals);
  const [assets, setAssets] = useState<string[]>(state.profile.assets);
  const [savingsMonths, setSavingsMonths] = useState(state.profile.savingsMonths || 12);

  const s = STEPS[Math.min(step, 5)];
  const entryVal = parseFloat(entry) || 0;

  // Restore the previously-typed value into the keypad on step change.
  useEffect(() => {
    const cur = STEPS[step];
    if (cur.keypad && cur.key) {
      const v = state.profile[cur.key];
      setEntry(v ? String(v) : "");
    } else {
      setEntry("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const toggleList = (label: string, list: string[], set: (v: string[]) => void) => {
    let arr = list;
    if (label === "None yet") arr = arr.includes("None yet") ? [] : ["None yet"];
    else {
      arr = arr.filter((x) => x !== "None yet");
      arr = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label];
    }
    set(arr);
  };

  const valid = [
    entryVal > 0,
    entryVal > 0,
    entry !== "",
    goals.length > 0,
    entryVal >= 13 && entryVal <= 100,
    assets.length > 0,
  ][step];

  async function next() {
    if (!valid || busy) return;
    setBusy(true);
    // Build the delta for this step.
    const delta: Record<string, unknown> = {};
    if (s.key) delta[s.key] = entryVal;
    if (step === 1) delta.savingsMonths = savingsMonths;
    if (step === 3) delta.goals = goals;
    if (step === 5) delta.assets = assets;

    try {
      if (step < 5) {
        const st = (await api.profile({ profile: delta, profileStep: step + 1 })) as AppState;
        setState(st);
        setStep(step + 1);
        setBusy(false);
      } else {
        const st = (await api.profile({ profile: delta, profileStep: 5, profileDone: true })) as AppState;
        // Prefill the onboarding limit entry with the server-computed suggestion.
        setEntry(st.profile.suggestedLimit > 0 ? String(st.profile.suggestedLimit) : "");
        setState(st);
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  const chipList = s.chips === "goals" ? goals : assets;
  const chipOpts = s.chips === "goals" ? GOAL_OPTS : ASSET_OPTS;
  const chipSpecs: ChipSpec[] = s.chips
    ? chipOpts.map((label) => ({
        label,
        selected: chipList.includes(label),
        onClick: () => (s.chips === "goals" ? toggleList(label, goals, setGoals) : toggleList(label, assets, setAssets)),
      }))
    : [];
  const timeSpecs: ChipSpec[] = TIME_CHIPS.map((t) => ({
    label: t.l,
    selected: savingsMonths === t.m,
    onClick: () => setSavingsMonths(t.m),
  }));

  const entryDisplay = s.money ? (entry ? "$" + entry : "$0") : entry || "0";

  return (
    <div
      data-screen-label="Profile questions"
      style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 22px 40px", overflow: "auto", animation: "bl-screen 500ms cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0 20px" }}>
        <button
          onClick={back}
          aria-label="Back"
          className="press-sm"
          style={{
            width: 34, height: 34, borderRadius: "50%", border: "none", background: C.surface2,
            color: C.textMuted2, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", padding: 0, visibility: step > 0 ? "visible" : "hidden",
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.surface3, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: PROGRESS_GRADIENT, width: Math.round(((step + 1) / 6) * 100) + "%", transition: "width 400ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
        </div>
        <div className="tnum" style={{ fontSize: 12, color: C.textMuted, flexShrink: 0 }}>
          {step + 1} of 6
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: C.mint }}>
        Getting to know you
      </div>
      <div className="font-grotesk" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", padding: "8px 0 6px" }}>
        {s.title}
      </div>
      <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, paddingBottom: 10 }}>{s.sub}</div>

      {s.keypad && (
        <div className="font-grotesk tnum" style={{ fontSize: 48, fontWeight: 700, textAlign: "center", padding: "8px 0 14px", color: entry ? C.text : C.textFaint }}>
          {entryDisplay}
        </div>
      )}

      {s.time && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: C.textMuted, padding: "2px 0 10px" }}>
            By when?
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 16 }}>
            {timeSpecs.map((c) => (
              <Chip key={c.label} spec={c} big={false} />
            ))}
          </div>
        </>
      )}

      {s.keypad && <Keypad onKey={keyTap} keySize={52} />}

      {s.chips && (
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", paddingTop: 8 }}>
          {chipSpecs.map((c) => (
            <Chip key={c.label} spec={c} />
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />
      <CTA onClick={next} disabled={!valid || busy} style={{ marginTop: 18 }}>
        {step === 5 ? "Finish" : "Continue"}
      </CTA>
    </div>
  );
}
