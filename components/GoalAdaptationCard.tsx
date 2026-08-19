"use client";

import { useMemo, useState } from "react";
import type { GoalAdaptation, GoalAdaptationRecord } from "@/types/fitness";

export function GoalAdaptationCard({
  goalAdaptation,
  applyGoalDate,
  applyCalories,
  rejectGoalAdaptation,
  currentGoalDate,
  currentGoalWeight,
  adaptationHistory,
  clearAdaptationHistory,
}: {
  goalAdaptation: GoalAdaptation;
  applyGoalDate: () => void;
  applyCalories: () => void;
  rejectGoalAdaptation: () => void;
  currentGoalDate: string;
  currentGoalWeight: number;
  adaptationHistory: GoalAdaptationRecord[];
  clearAdaptationHistory: () => void;
}) {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const groupedHistory = useMemo(
    () => groupAdaptationsByMonth(adaptationHistory),
    [adaptationHistory]
  );

  function toggleMonth(monthYear: string) {
    setExpandedMonths((current) =>
      current.includes(monthYear)
        ? current.filter((item) => item !== monthYear)
        : [...current, monthYear]
    );
  }

  function clearHistory() {
    if (!confirm("Clear goal adaptation history?")) {
      return;
    }

    clearAdaptationHistory();
    setExpandedMonths([]);
    setExpandedRecordId(null);
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Goal Adaptation</h2>
          <p className="mt-2 text-sm text-slate-500">
            Adjusts the goal date or calorie target when the current plan is no
            longer realistic.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {goalAdaptation.confidence} confidence
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-500">Status</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {goalAdaptation.status}
        </p>
        <p className="mt-3 text-slate-700">{goalAdaptation.recommendation}</p>
        <p className="mt-2 text-sm text-slate-500">{goalAdaptation.reason}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Goal Date
          </p>
          <p className="mt-1 font-semibold text-slate-900">{currentGoalDate}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Goal Weight
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {currentGoalWeight.toFixed(1)} lbs
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <AdjustmentButton
          label="Suggested Goal Date"
          value={goalAdaptation.suggestedGoalDate ?? "No date change"}
          onClick={applyGoalDate}
          disabled={!goalAdaptation.suggestedGoalDate}
        />
        <AdjustmentButton
          label="Suggested Calories"
          value={
            goalAdaptation.suggestedCalories
              ? `${goalAdaptation.suggestedCalories} cal/day`
              : "Need more data"
          }
          onClick={applyCalories}
          disabled={!goalAdaptation.suggestedCalories}
        />
      </div>

      <button
        onClick={rejectGoalAdaptation}
        className="mt-3 w-full rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
      >
        Reject Current Suggestion
      </button>

      {adaptationHistory.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">Adaptation History</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {adaptationHistory.length} saved
              </span>
              <button
                onClick={clearHistory}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
              >
                Clear history
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {groupedHistory.map((group) => {
              const isMonthExpanded = expandedMonths.includes(group.monthYear);

              return (
                <div key={group.monthYear} className="rounded-2xl bg-white p-3">
                  <button
                    onClick={() => toggleMonth(group.monthYear)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {group.monthYear}
                      </p>
                      <p className="text-sm text-slate-500">
                        {group.records.length} adjustment
                        {group.records.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {isMonthExpanded ? "Hide" : "View"}
                    </span>
                  </button>

                  {isMonthExpanded && (
                    <div className="mt-3 space-y-2">
                      {group.records.map((item) => {
                        const isExpanded = expandedRecordId === item.id;

                        return (
                          <article
                            key={item.id}
                            className="rounded-xl border border-slate-200 p-3 text-sm"
                          >
                            <button
                              onClick={() =>
                                setExpandedRecordId(isExpanded ? null : item.id)
                              }
                              className="flex w-full items-start justify-between gap-4 text-left"
                            >
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  {item.createdAt}
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {item.status} {item.changeType}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {isExpanded ? "Hide" : "Open"}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-700">
                                <p>{item.reason}</p>
                                <p className="mt-2 text-slate-500">
                                  Previous: {item.previousGoalWeight.toFixed(1)} lbs
                                  by {item.previousGoalDate}
                                </p>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function groupAdaptationsByMonth(adaptationHistory: GoalAdaptationRecord[]) {
  const groups: Record<string, GoalAdaptationRecord[]> = {};

  adaptationHistory.forEach((record) => {
    const monthYear = getMonthYear(record.createdAt);

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }

    groups[monthYear].push(record);
  });

  return Object.entries(groups).map(([monthYear, records]) => ({
    monthYear,
    records,
  }));
}

function getMonthYear(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved adjustments";
  }

  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function AdjustmentButton({
  label,
  value,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl bg-slate-900 p-4 text-left text-white disabled:bg-slate-100 disabled:text-slate-500"
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </button>
  );
}
