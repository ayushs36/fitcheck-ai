import type { DataFreshness } from "@/types/fitness";

export function DataFreshnessCard({
  dataFreshness,
}: {
  dataFreshness: DataFreshness;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Data Freshness</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tracks missed days and reduces coaching confidence when logs are
            stale.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {dataFreshness.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FreshnessStat label="Score" value={`${dataFreshness.score}/100`} />
        <FreshnessStat
          label="Last Log"
          value={dataFreshness.lastLogDate ?? "No logs"}
        />
        <FreshnessStat
          label="Days Since Log"
          value={
            dataFreshness.daysSinceLastLog === null
              ? "N/A"
              : `${dataFreshness.daysSinceLastLog}`
          }
        />
        <FreshnessStat
          label="Missed Last 14"
          value={`${dataFreshness.missedDaysLast14}`}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-500">
            Confidence Impact
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {dataFreshness.confidenceImpact}
          </p>
          <p className="mt-2 text-sm text-slate-700">{dataFreshness.message}</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-slate-600">
            Recommended Fix
          </p>
          <p className="mt-2 text-slate-800">
            {dataFreshness.recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}

function FreshnessStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
