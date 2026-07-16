import type { GoalForecast } from "@/types/fitness";

export function GoalForecastCard({
  goalForecast,
}: {
  goalForecast: GoalForecast;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Goal Forecast</h2>
          <p className="mt-2 text-sm text-slate-500">
            Compares projected goal dates at 1, 1.5, and 2 lb/week so you can
            see what each pace would require.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {goalForecast.status} - {goalForecast.confidence} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <ForecastStat
          label="Current"
          value={`${goalForecast.currentWeight.toFixed(1)} lbs`}
        />
        <ForecastStat
          label="Target"
          value={`${goalForecast.targetWeight.toFixed(1)} lbs`}
        />
        <ForecastStat
          label="Remaining"
          value={`${goalForecast.poundsRemaining.toFixed(1)} lbs`}
        />
        <ForecastStat
          label="Required pace"
          value={`${goalForecast.requiredWeeklyPace.toFixed(1)} lb/week`}
        />
      </div>

      {goalForecast.scenarios.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {goalForecast.scenarios.map((scenario) => (
            <div
              key={scenario.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-500">
                {scenario.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {scenario.projectedDate}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {scenario.projectedDays} days at{" "}
                {scenario.weeklyPace.toFixed(1)} lb/week
              </p>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">
                Target-date weight:{" "}
                {scenario.projectedWeightAtTargetDate.toFixed(1)} lbs
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
          {goalForecast.confidenceReason}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="font-semibold">Forecast confidence</p>
          <p className="mt-2 text-sm text-slate-600">
            {goalForecast.confidenceReason}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="font-semibold">Recommendation</p>
          <p className="mt-2 text-sm text-slate-700">
            {goalForecast.recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}

function ForecastStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
