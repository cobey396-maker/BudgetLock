import Link from "next/link";
import type { ReactNode } from "react";

/** Shared shell for the privacy policy and terms pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="legal">
      <Link href="/" className="legal-back">
        ← BudgetLock
      </Link>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated {updated}</p>
      {children}
      <footer className="legal-footer">
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms">Terms</Link>
        <span aria-hidden="true">·</span>
        <Link href="/">Open the app</Link>
      </footer>
    </main>
  );
}
