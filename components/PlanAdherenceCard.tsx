import type { PlanAdherence } from "@/types/fitness";

export function PlanAdherenceCard({
  planAdherence,
}: {
  planAdherence: PlanAdherence;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Plan Adherence</h2>
          <p className="mt-2 text-sm text-slate-500">
            Compares recent logs against the active weekly plan and highlights
            the biggest blocker.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {planAdherence.score}/100
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-500">Trend</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {planAdherence.trend}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-slate-600">
            Biggest Blocker
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {planAdherence.biggestBlocker}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {planAdherence.blockerRecommendation}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {planAdherence.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{metric.label}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Target: {metric.target}
                </p>
                <p className="text-sm text-slate-500">
                  Actual: {metric.actual}
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                {metric.score}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {metric.status}
            </p>
          </div>
        ))}
      </div>

      {planAdherence.weeklyScores.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-500">
            Recent Adherence Trend
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            {planAdherence.weeklyScores.map((week) => (
              <div key={week.label} className="rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {week.label}
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {week.score}/100
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
