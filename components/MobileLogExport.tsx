"use client";

import {useState} from "react";
import type {Goal, GoalHistoryRecord, LogEntry} from "@/types/fitness";
import {createMobileLogExport} from "@/lib/mobileLogExport";

export function MobileLogExport({logs, goal, goalHistory}: {logs: LogEntry[]; goal: Goal; goalHistory: GoalHistoryRecord[]}) {
  const [message, setMessage] = useState("");
  function download() {
    try {
      const exportedAt = new Date().toISOString();
      const raw = createMobileLogExport(logs, goal, goalHistory, exportedAt);
      const url = URL.createObjectURL(new Blob([raw], {type: "application/json"}));
      const link = document.createElement("a");
      link.href = url; link.download = `fitcheck-personal-logs-${exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMessage("Export downloaded. Keep this file private; it contains your fitness logs.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed. Your logs were not changed."); }
  }
  return <div className="border-b border-slate-200 py-4">
    <button type="button" disabled={!logs.length} onClick={download}
      className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
      Export logs to FitCheck Coach
    </button>
    {message && <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>}
  </div>;
}
