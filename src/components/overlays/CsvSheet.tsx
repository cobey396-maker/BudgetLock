"use client";
import { useState } from "react";
import { useCtx, money } from "../ctx";
import { api, parseCsv, csvSampleText } from "@/lib/client";
import { C } from "@/lib/tokens";
import { CATEGORIES, categoryById } from "@/lib/categories";

export default function CsvSheet({ onClose }: { onClose: () => void }) {
  const { setState, setScreen } = useCtx();
  const [step, setStep] = useState<"intro" | "success">("intro");
  const [category, setCategory] = useState("food");
  const [error, setError] = useState("");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);

  async function doImport(text: string) {
    const rows = parseCsv(text);
    if (!rows.length) {
      setError("No usable rows found. Check the file has date, description, and amount columns.");
      return;
    }
    try {
      const res = await api.importCsv({ rows, categoryId: category });
      setImported(res.imported);
      setTotal(res.importedTotal);
      setState(res);
      setError("");
      setStep("success");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => doImport(String(r.result));
      r.readAsText(f);
    };
    input.click();
  }

  const catLabel = (categoryById(category)?.label || "Untracked").toLowerCase();

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.55)", animation: "bl-fade 250ms ease-out" }}>
      <div data-screen-label="CSV import" style={{ background: C.surface2, color: C.text, borderRadius: "24px 24px 0 0", padding: "20px 22px 44px", minHeight: "58%", display: "flex", flexDirection: "column", animation: "bl-sheet 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
          <span className="font-grotesk" style={{ fontSize: 20, fontWeight: 700 }}>Import CSV</span>
          <button onClick={onClose} aria-label="Close" className="press-sm" style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.07)", color: C.textMuted2, fontSize: 16, cursor: "pointer", padding: 0 }}>×</button>
        </div>

        {step === "intro" ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: 8 }}>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.55 }}>Export a CSV from Cash App, Venmo, or any bank that isn&apos;t on Plaid, then import it here. Expected columns:</div>
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: C.surface, border: "1px solid rgba(255,255,255,0.06)", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 12, color: C.textMuted2, lineHeight: 1.7, overflow: "auto", whiteSpace: "nowrap" }}>
              date, description, amount<br />2026-07-10, CASH APP *COFFEE, 6.50
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: C.textMuted, padding: "20px 0 10px" }}>File under</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => {
                const sel = category === c.id;
                return (
                  <button key={c.id} onClick={() => setCategory(c.id)} className="press-chip" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 999, border: `1px solid ${sel ? C.mintTintBorder : C.border}`, background: sel ? C.mintTintBg : C.surface, color: sel ? C.mint : C.textSecondary, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                    {c.label}
                  </button>
                );
              })}
            </div>

            {error && <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", fontSize: 13, color: C.coral }}>{error}</div>}

            <div style={{ flex: 1 }} />
            <button onClick={pickFile} className="press font-grotesk" style={{ height: 52, borderRadius: 26, border: "none", background: "linear-gradient(135deg, #5FF0B6 0%, #2BC286 100%)", boxShadow: "0 6px 20px rgba(61,220,151,0.25)", color: C.onMint, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 20 }}>Choose CSV file</button>
            <button onClick={() => doImport(csvSampleText())} style={{ height: 44, border: "none", background: "none", color: C.mint, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>Try with sample Cash App data</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", textAlign: "center", paddingTop: 34 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(61,220,151,0.15)", display: "flex", alignItems: "center", justifyContent: "center", animation: "bl-rise 350ms ease-out" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 18 }}>{imported} transaction{imported === 1 ? "" : "s"} imported</div>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.55, maxWidth: 280, marginTop: 8 }}>{money(total, true)} filed under {catLabel}. You can recategorize by deleting and re-logging any entry.</div>
            <div style={{ flex: 1 }} />
            <button onClick={() => { onClose(); setScreen("activity"); }} className="press font-grotesk" style={{ width: "100%", height: 50, borderRadius: 25, border: "none", background: "linear-gradient(135deg, #5FF0B6 0%, #2BC286 100%)", color: C.onMint, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
