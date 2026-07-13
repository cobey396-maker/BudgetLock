"use client";
import { useState } from "react";
import { useCtx } from "../ctx";
import BottomNav from "../ui/BottomNav";
import Dashboard from "./Dashboard";
import Activity from "./Activity";
import AddTransaction from "./AddTransaction";
import Limits from "./Limits";
import Settings from "./Settings";
import TxnDetail from "../overlays/TxnDetail";
import PlaidSheet from "../overlays/PlaidSheet";
import CsvSheet from "../overlays/CsvSheet";

export default function MainApp() {
  const { screen } = useCtx();
  const [plaidOpen, setPlaidOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <>
      {screen === "dashboard" && <Dashboard />}
      {screen === "activity" && <Activity />}
      {screen === "add" && <AddTransaction />}
      {screen === "limits" && <Limits />}
      {screen === "settings" && <Settings openPlaid={() => setPlaidOpen(true)} openCsv={() => setCsvOpen(true)} />}

      {screen !== "add" && <BottomNav />}

      <TxnDetail />
      {plaidOpen && <PlaidSheet onClose={() => setPlaidOpen(false)} />}
      {csvOpen && <CsvSheet onClose={() => setCsvOpen(false)} />}
    </>
  );
}
