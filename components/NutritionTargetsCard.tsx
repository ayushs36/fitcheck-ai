import type { NutritionTargets } from "@/types/fitness";

export function NutritionTargetsCard({
  nutritionTargets,
}: {
  nutritionTargets: NutritionTargets;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Nutrition Targets</h2>
          <p className="mt-2 text-sm text-slate-500">
            Uses maintenance, goal type, and trend data to create practical
            daily targets.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {nutritionTargets.confidence} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TargetStat label="Calories" value={nutritionTargets.calorieRange} />
        <TargetStat label="Protein" value={nutritionTargets.proteinRange} />
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="font-semibold text-slate-900">
          {nutritionTargets.priority}
        </p>
        <p className="mt-2 text-slate-700">{nutritionTargets.guidance}</p>
      </div>
    </section>
  );
}

function TargetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
