import type { WeeklyPlan } from "@/types/fitness";

export function WeeklyPlanCard({ weeklyPlan }: { weeklyPlan: WeeklyPlan }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Weekly Plan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Turns the current agent decision into targets for the next 7 days.
          </p>
        </div>

        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {weeklyPlan.adherenceScore}/100 adherence
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <PlanStat label="Focus" value={weeklyPlan.focus} />
        <PlanStat label="Calories" value={weeklyPlan.calories} />
        <PlanStat label="Protein" value={weeklyPlan.protein} />
        <PlanStat label="Steps" value={weeklyPlan.steps} />
        <PlanStat label="Training" value={weeklyPlan.training} />
        <PlanStat label="Recovery" value={weeklyPlan.recovery} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Agent Adjustment Logic
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {weeklyPlan.adjustment.status}
            </p>
          </div>

          <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
            {weeklyPlan.adjustment.confidence} confidence
          </span>
        </div>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
          {weeklyPlan.adjustment.recommendation}
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <PlanStat label="Trigger" value={weeklyPlan.adjustment.trigger} />
          <PlanStat label="Guardrail" value={weeklyPlan.adjustment.guardrail} />
          <PlanStat
            label="Review Window"
            value={weeklyPlan.adjustment.reviewWindow}
          />
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
        {weeklyPlan.adherenceSummary}
      </p>
    </section>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
