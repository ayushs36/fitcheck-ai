import type { DailyBrief } from "@/types/fitness";

export function DailyBriefCard({ brief }: { brief: DailyBrief }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Agent Daily Brief
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            {brief.todayFocus}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
            {brief.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {brief.confidence} confidence
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Changed Since Last Log
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {brief.changedSinceLastLog}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Do This Next
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
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
    </section>
  );
}
