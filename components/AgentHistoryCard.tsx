"use client";

import { useMemo, useState } from "react";
import type { AgentCheck } from "@/types/fitness";

export function AgentHistoryCard({
  agentHistory,
  expandedAgentCheckId,
  setExpandedAgentCheckId,
  clearAgentHistory,
}: {
  agentHistory: AgentCheck[];
  expandedAgentCheckId: string | null;
  setExpandedAgentCheckId: (id: string | null) => void;
  clearAgentHistory: () => void;
}) {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const groupedHistory = useMemo(
    () => groupAgentChecksByMonth(agentHistory),
    [agentHistory]
  );

  function toggleMonth(monthYear: string) {
    setExpandedMonths((current) =>
      current.includes(monthYear)
        ? current.filter((item) => item !== monthYear)
        : [...current, monthYear]
    );
  }

  function clearHistory() {
    if (!confirm("Clear Agent History?")) {
      return;
    }

    clearAgentHistory();
    setExpandedMonths([]);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Agent History</h2>
          <p className="mt-2 text-sm text-slate-500">
            Saved coaching decisions grouped by month.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {agentHistory.length} saved
          </span>
          {agentHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {agentHistory.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">
              No agent decisions saved yet
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Save daily logs first, then run FitCheck Agent from the Coach tab.
            </p>
          </div>
        ) : (
          groupedHistory.map((group) => {
            const isMonthExpanded = expandedMonths.includes(group.monthYear);

            return (
              <div key={group.monthYear} className="rounded-2xl bg-slate-100 p-4">
                <button
                  onClick={() => toggleMonth(group.monthYear)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {group.monthYear}
                    </p>
                    <p className="text-sm text-slate-500">
                      {group.checks.length} decision
                      {group.checks.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {isMonthExpanded ? "Hide" : "View"}
                  </span>
                </button>

                {isMonthExpanded && (
                  <div className="mt-4 space-y-2">
                    {group.checks.map((check) => {
                      const isExpanded = expandedAgentCheckId === check.id;
                      const decision = check.decision ?? "Not specified";
                      const nextAction =
                        check.nextAction ?? check.recommendation;

                      return (
                        <article
                          key={check.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <button
                            onClick={() =>
                              setExpandedAgentCheckId(
                                isExpanded ? null : check.id
                              )
                            }
                            className="flex w-full items-start justify-between gap-4 text-left"
                          >
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {check.date}
                              </p>
                              <p className="mt-1 font-semibold text-slate-950">
                                {decision}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {check.status}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {isExpanded ? "Hide" : "Open"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                              <AgentHistoryDetail
                                label="Biggest risk"
                                value={check.biggestRisk}
                              />
                              <AgentHistoryDetail
                                label="Next action"
                                value={nextAction}
                              />
                              <AgentHistoryDetail
                                label="Confidence"
                                value={check.confidence}
                              />
                              <AgentHistoryDetail
                                label="Recommendation change"
                                value={
                                  check.changeSummary ??
                                  "No previous comparison"
                                }
                              />
                              <AgentHistoryDetail
                                label="Full response"
                                value={check.fullResponse}
                                preserveLines
                              />
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AgentHistoryDetail({
  label,
  value,
  preserveLines = false,
}: {
  label: string;
  value: string;
  preserveLines?: boolean;
}) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{label}</p>
      <p className={`mt-1 text-slate-700 ${preserveLines ? "whitespace-pre-line" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function groupAgentChecksByMonth(agentHistory: AgentCheck[]) {
  const groups: Record<string, AgentCheck[]> = {};

  agentHistory.forEach((check) => {
    const monthYear = getMonthYear(check.date);

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }

    groups[monthYear].push(check);
  });

  return Object.entries(groups).map(([monthYear, checks]) => ({
    monthYear,
    checks,
  }));
}

function getMonthYear(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved decisions";
  }

  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}
