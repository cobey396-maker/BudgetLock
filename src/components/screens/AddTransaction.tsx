"use client";
import { useState } from "react";
import type { AppState } from "@/lib/types";
import { useCtx, money } from "../ctx";
import { api } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CATEGORIES } from "@/lib/categories";
import { CTA, Keypad, Chip, Field, type ChipSpec } from "../ui/primitives";

export default function AddTransaction() {
  const { state, setState, entry, setEntry, keyTap, setScreen, rev, busy, setBusy } = useCtx();
  const [category, setCategory] = useState("groceries");
  const [note, setNote] = useState("");
  const entryVal = parseFloat(entry) || 0;

  const catAgg = state.summary.categories.find((c) => c.id === category);
  const hint =
    entryVal > 0 && catAgg
      ? catAgg.over
        ? "This category is already over its limit"
        : money(catAgg.limit - catAgg.spent) + " left in " + catAgg.label.toLowerCase()
      : " ";

  const chips: ChipSpec[] = CATEGORIES.map((c) => ({
    label: c.label,
    icon: c.icon,
    selected: category === c.id,
    onClick: () => setCategory(c.id),
  }));

  function cancel() {
    setScreen("dashboard");
    setEntry("");
    setNote("");
    rev();
  }

  async function save() {
    if (entryVal <= 0 || busy) return;
    setBusy(true);
    try {
      const st = (await api.addManual({ amount: entryVal, categoryId: category, note: note.trim() })) as AppState;
      setState(st);
      setEntry("");
      setNote("");
      setScreen("dashboard");
      rev();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-screen-label="Add transaction" style={{ flex: 1, overflow: "auto", padding: "8px 22px 30px", display: "flex", flexDirection: "column", animation: "bl-sheet 460ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0 8px" }}>
        <span className="font-grotesk" style={{ fontSize: 24, fontWeight: 700 }}>Log a purchase</span>
        <button onClick={cancel} aria-label="Cancel" className="press-sm" style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: C.surface2, color: C.textMuted2, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
      </div>

      <div className="font-grotesk tnum" style={{ fontSize: 52, fontWeight: 700, textAlign: "center", padding: "18px 0 6px", color: entry ? C.text : C.textFaint }}>{entry ? "$" + entry : "$0"}</div>
      <div style={{ textAlign: "center", fontSize: 13, color: hint.includes("over") ? C.coral : C.textMuted, paddingBottom: 16, minHeight: 20 }}>{hint}</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", paddingBottom: 18 }}>
        {chips.map((c) => (
          <Chip key={c.label} spec={c} big={false} />
        ))}
      </div>

      <Field placeholder="Note (e.g. lunch with Sam)" value={note} onChange={(e) => setNote(e.target.value)} style={{ height: 48, marginBottom: 18 }} />

      <Keypad onKey={keyTap} keySize={52} />

      <div style={{ flex: 1 }} />
      <CTA onClick={save} disabled={entryVal <= 0 || busy} style={{ marginTop: 16 }}>Log purchase</CTA>
    </div>
  );
}
