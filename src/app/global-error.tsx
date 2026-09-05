"use client";

// Catches failures in the root layout itself, where `error.tsx` cannot run.
// It must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
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
          fontFamily: "-apple-system, system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>BudgetLock hit an error</h1>
        <p style={{ fontSize: 15, color: "#8B8B96", margin: 0, maxWidth: 320, lineHeight: 1.55 }}>
          Reload to get back in. Nothing in your account was changed.
        </p>
        {error.digest && <code style={{ fontSize: 12, color: "#55555F" }}>Reference: {error.digest}</code>}
        <button
          onClick={reset}
          style={{
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
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
