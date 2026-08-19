"use client";

import { useMemo, useState } from "react";
import type { CoachingPlanRecord, WeeklyPlan } from "@/types/fitness";

export function CoachingPlanHistoryCard({
  weeklyPlan,
  planHistory,
  saveCurrentPlan,
  clearPlanHistory,
}: {
  weeklyPlan: WeeklyPlan;
  planHistory: CoachingPlanRecord[];
  saveCurrentPlan: () => void;
  clearPlanHistory: () => void;
}) {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const groupedPlans = useMemo(
    () => groupPlansByMonth(planHistory),
    [planHistory]
  );

  function toggleMonth(monthYear: string) {
    setExpandedMonths((current) =>
      current.includes(monthYear)
        ? current.filter((item) => item !== monthYear)
        : [...current, monthYear]
    );
  }

  function clearHistory() {
    if (!confirm("Clear saved coaching plans?")) {
      return;
    }

    clearPlanHistory();
    setExpandedMonths([]);
    setExpandedPlanId(null);
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Coaching Plan History</h2>
          <p className="mt-2 text-sm text-slate-500">
            Save plan snapshots and review how the coach changes targets over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {planHistory.length} saved
          </span>
          <button
            onClick={saveCurrentPlan}
            className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white"
          >
            Save current plan
          </button>
          {planHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Current plan
        </p>
        <p className="mt-1 font-semibold text-slate-950">{weeklyPlan.focus}</p>
        <p className="mt-1 text-sm text-slate-600">
          {weeklyPlan.calories} · {weeklyPlan.steps}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {planHistory.length === 0 ? (
          <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
            No saved coaching plans yet.
          </p>
        ) : (
          groupedPlans.map((group) => {
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
                      {group.plans.length} saved plan
                      {group.plans.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {isMonthExpanded ? "Hide" : "View"}
                  </span>
                </button>

                {isMonthExpanded && (
                  <div className="mt-4 space-y-2">
                    {group.plans.map((record) => {
                      const isExpanded = expandedPlanId === record.id;

                      return (
                        <article
                          key={record.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <button
                            onClick={() =>
                              setExpandedPlanId(isExpanded ? null : record.id)
                            }
                            className="flex w-full items-start justify-between gap-4 text-left"
                          >
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {new Date(record.createdAt).toLocaleString()}
                              </p>
                              <p className="mt-1 font-semibold text-slate-950">
                                {record.decision}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.plan.focus}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {isExpanded ? "Hide" : "Open"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                              <PlanDetail label="Calories" value={record.plan.calories} />
                              <PlanDetail label="Protein" value={record.plan.protein} />
                              <PlanDetail label="Steps" value={record.plan.steps} />
                              <PlanDetail label="Training" value={record.plan.training} />
                              <PlanDetail label="Recovery" value={record.plan.recovery} />
                              <PlanDetail label="Priority" value={record.priority} />
                              <PlanDetail label="Confidence" value={record.confidence} />
                              <PlanDetail
                                label="Changes"
                                value={
                                  record.changesFromPrevious.length > 0
                                    ? record.changesFromPrevious.join("\n")
                                    : "No previous saved plan to compare yet."
                                }
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

function PlanDetail({
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

function groupPlansByMonth(planHistory: CoachingPlanRecord[]) {
  const groups: Record<string, CoachingPlanRecord[]> = {};

  planHistory.forEach((record) => {
    const monthYear = getMonthYear(record.createdAt);

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }

    groups[monthYear].push(record);
  });

  return Object.entries(groups).map(([monthYear, plans]) => ({
    monthYear,
    plans,
  }));
}

function getMonthYear(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved plans";
  }

  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}
