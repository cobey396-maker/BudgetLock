"use client";
import type { AppState } from "./types";

async function call<T = AppState>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}

export const api = {
  state: () => call("/api/state", "GET"),
  signup: (b: { name: string; email: string; password: string }) => call("/api/auth/signup", "POST", b),
  login: (b: { email: string; password: string }) => call("/api/auth/login", "POST", b),
  logout: () => call<{ ok: boolean }>("/api/auth/logout", "POST"),
  profile: (b: unknown) => call("/api/profile", "PUT", b),
  budget: (b: unknown) => call("/api/budget", "PUT", b),
  addManual: (b: { amount: number; categoryId: string; note: string }) =>
    call("/api/transactions", "POST", { type: "manual", ...b }),
  importCsv: (b: { rows: { date: string; name: string; amount: number }[]; categoryId: string }) =>
    call<AppState & { imported: number; importedTotal: number }>("/api/transactions", "POST", {
      type: "csv",
      ...b,
    }),
  removeTxn: (id: string) => call(`/api/transactions?id=${encodeURIComponent(id)}`, "DELETE"),
  connectBank: (bankName: string) =>
    call<AppState & { imported: number }>("/api/plaid/connect", "POST", { bankName }),
  resetDemo: () => call("/api/demo/reset", "POST"),
};

// Parse a CSV export (Cash App / Venmo / bank) into {date,name,amount} rows.
// Ported from the prototype's parseCsv.
export function parseCsv(text: string): { date: string; name: string; amount: number }[] {
  const splitRow = (l: string) =>
    l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((f) => f.trim().replace(/^"(.*)"$/, "$1"));
  const normDate = (v: string) => {
    v = (v || "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) return (m[3].length === 2 ? "20" + m[3] : m[3]) + "-" + m[1].padStart(2, "0") + "-" + m[2].padStart(2, "0");
    return null;
  };
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  let di = 0, ni = 1, ai = 2, start = 0;
  const head = splitRow(lines[0]).map((h) => h.toLowerCase());
  if (head.some((h) => h.includes("date") || h.includes("amount"))) {
    start = 1;
    const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.includes(k)));
    di = Math.max(find("date"), 0);
    ni = Math.max(find("description", "name", "memo", "note", "merchant"), 1);
    ai = Math.max(find("amount", "total"), 2);
  }
  const rows: { date: string; name: string; amount: number }[] = [];
  for (let i = start; i < lines.length; i++) {
    const f = splitRow(lines[i]);
    const date = normDate(f[di]);
    const amount = Math.abs(parseFloat((f[ai] || "").replace(/[$,\s]/g, "")));
    if (!date || !amount || isNaN(amount)) continue;
    rows.push({ date, name: f[ni] || "CSV import", amount });
  }
  return rows;
}

export function csvSampleText(): string {
  const day = (o: number) => new Date(Date.now() - o * 864e5).toISOString().slice(0, 10);
  return (
    "date,description,amount\n" +
    day(0) + ",CASH APP *BLUE BOTTLE,7.25\n" +
    day(1) + ",CASH APP *SPLIT DINNER W/ ALEX,24.50\n" +
    day(2) + ",CASH APP *FARMERS MARKET,18.00\n" +
    day(4) + ",CASH APP *CAR WASH,15.00"
  );
}
