"use client";
import { useEffect } from "react";

// Route-level error boundary: a render failure shows a recoverable screen
// instead of a blank page.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[budgetlock] render error", error);
  }, [error]);

  return (
    <main style={wrap}>
      <h1 style={h1}>Something went wrong</h1>
      <p style={p}>
        Your data is safe. Try again, and if it keeps happening reload the page.
      </p>
      {error.digest && <code style={code}>Reference: {error.digest}</code>}
      <button onClick={reset} style={cta}>
        Try again
      </button>
    </main>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: 32,
  textAlign: "center",
  background: "#131318",
  color: "#F2F2F5",
};
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" };
const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.55, color: "#8B8B96", margin: 0, maxWidth: 320 };
const code: React.CSSProperties = { fontSize: 12, color: "#55555F" };
const cta: React.CSSProperties = {
  marginTop: 12,
  height: 48,
  padding: "0 26px",
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #5FF0B6 0%, #2BC286 100%)",
  color: "#10251C",
  fontSize: 15,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer",
};
