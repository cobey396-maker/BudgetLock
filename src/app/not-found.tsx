import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
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
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Page not found</h1>
      <p style={{ fontSize: 15, color: "#8B8B96", margin: 0, maxWidth: 300, lineHeight: 1.55 }}>
        That link doesn&apos;t go anywhere in BudgetLock.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 12,
          height: 48,
          display: "inline-flex",
          alignItems: "center",
          padding: "0 26px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #5FF0B6 0%, #2BC286 100%)",
          color: "#10251C",
          fontSize: 15,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Back to the gauge
      </Link>
    </main>
  );
}
