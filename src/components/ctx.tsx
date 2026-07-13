"use client";
import { createContext, useContext } from "react";
import type { AppState } from "@/lib/types";

export type Screen = "dashboard" | "activity" | "add" | "limits" | "settings";
export type PlaidStep = null | "intro" | "banks" | "creds" | "connecting" | "success";
export type CsvStep = null | "intro" | "success";

export type Ctx = {
  state: AppState;
  setState: (s: AppState | null) => void;
  plaidConfigured: boolean;

  // ephemeral UI
  screen: Screen;
  setScreen: (s: Screen) => void;
  entry: string;
  setEntry: (e: string) => void;
  keyTap: (k: string) => void;

  // gauge animation
  gaugeOn: boolean;
  dispSpent: number;
  rev: () => void;

  busy: boolean;
  setBusy: (b: boolean) => void;

  // transaction detail
  detailTxn: AppState["transactions"][number] | null;
  setDetailTxn: (t: AppState["transactions"][number] | null) => void;
};

export const AppCtx = createContext<Ctx | null>(null);
export const useCtx = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useCtx outside provider");
  return c;
};

export const money = (n: number, cents = false) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
