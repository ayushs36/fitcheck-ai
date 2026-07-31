import type { DailyBrief } from "@/types/fitness";

export function DailyBriefCard({ brief }: { brief: DailyBrief }) {
  const modeClass = getModeClass(brief.agentMode);

  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="h-1.5 bg-blue-600" />
      <div className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Agent Daily Brief
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            {brief.todayFocus}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${modeClass}`}
          >
            {brief.agentMode}
          </span>
          <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
            {brief.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {brief.confidence} confidence
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Agent Loop
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {brief.checkpointStatus}
            </p>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {brief.agentRunAdvice}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Goal Phase
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
          {brief.goalContext}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Changed Since Last Log
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {brief.changedSinceLastLog}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Do This Next
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-950">
            {brief.nextAction}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {brief.evidence.map((item) => (
          <span
            key={item}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
      </div>
    </section>
  );
}

function getModeClass(mode: DailyBrief["agentMode"]) {
  if (mode === "Rerun due") {
    return "bg-blue-50 text-blue-700";
  }

  if (mode === "Ready to run") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (mode === "Refresh data" || mode === "Build baseline") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}
