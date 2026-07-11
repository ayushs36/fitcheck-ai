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
  const latestPlan = planHistory[0];

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Coaching Plan History</h2>
          <p className="mt-2 text-sm text-slate-500">
            Save weekly plan snapshots and compare how the coach changes your
            calories, steps, training, and recovery focus over time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveCurrentPlan}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Save Current Plan
          </button>
          {planHistory.length > 0 && (
            <button
              onClick={clearPlanHistory}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <PlanSnapshot label="Current Focus" value={weeklyPlan.focus} />
        <PlanSnapshot label="Current Calories" value={weeklyPlan.calories} />
        <PlanSnapshot label="Current Steps" value={weeklyPlan.steps} />
        <PlanSnapshot
          label="Current Recovery"
          value={weeklyPlan.recovery}
        />
      </div>

      {latestPlan ? (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-500">
            Latest saved plan
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {new Date(latestPlan.createdAt).toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Decision: {latestPlan.decision} - Priority: {latestPlan.priority} -
            Confidence: {latestPlan.confidence}
          </p>

          <div className="mt-4 space-y-2">
            {latestPlan.changesFromPrevious.length === 0 ? (
              <p className="text-sm text-slate-600">
                No previous saved plan to compare yet.
              </p>
            ) : (
              latestPlan.changesFromPrevious.map((change) => (
                <p
                  key={change}
                  className="rounded-xl bg-white p-3 text-sm text-slate-700"
                >
                  {change}
                </p>
              ))
            )}
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
          No saved coaching plans yet.
        </p>
      )}

      {planHistory.length > 1 && (
        <div className="mt-5 space-y-3">
          {planHistory.slice(1, 4).map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold">
                {new Date(record.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {record.plan.focus} - {record.plan.calories}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PlanSnapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
