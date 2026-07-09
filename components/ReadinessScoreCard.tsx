import type { ReadinessScore } from "@/types/fitness";

export function ReadinessScoreCard({
  readinessScore,
}: {
  readinessScore: ReadinessScore;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Readiness Score</h2>
          <p className="mt-2 text-sm text-slate-500">
            Combines adherence, recovery risk, trend strength, pace, and data
            freshness.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {readinessScore.status}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-500">Score</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">
          {readinessScore.score}/100
        </p>
        <p className="mt-2 text-sm text-slate-700">
          {readinessScore.recommendation}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {readinessScore.drivers.map((driver) => (
          <p key={driver} className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            {driver}
          </p>
        ))}
      </div>
    </section>
  );
}
