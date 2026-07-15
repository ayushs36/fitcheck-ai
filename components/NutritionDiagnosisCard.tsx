import type { NutritionDiagnosis } from "@/types/fitness";

export function NutritionDiagnosisCard({
  nutritionDiagnosis,
}: {
  nutritionDiagnosis: NutritionDiagnosis;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Agent Nutrition Diagnosis</h2>
          <p className="mt-2 text-sm text-slate-500">
            Evaluates whether nutrition execution is strong enough for the
            agent to trust calorie and weight-trend decisions.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {nutritionDiagnosis.score}/100 - {nutritionDiagnosis.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <DiagnosisStat
          label="Calorie avg"
          value={
            nutritionDiagnosis.calorieAverage > 0
              ? `${nutritionDiagnosis.calorieAverage.toFixed(0)} cal`
              : "Need data"
          }
        />
        <DiagnosisStat
          label="Calorie consistency"
          value={
            nutritionDiagnosis.calorieVariance > 0
              ? `${nutritionDiagnosis.calorieVariance.toFixed(0)} cal swing`
              : "Need data"
          }
        />
        <DiagnosisStat
          label="Protein avg"
          value={
            nutritionDiagnosis.proteinAverage > 0
              ? `${nutritionDiagnosis.proteinAverage.toFixed(0)}g`
              : "Need data"
          }
        />
      </div>

      {nutritionDiagnosis.metrics.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {nutritionDiagnosis.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{metric.label}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {metric.status}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {metric.score}/100
              </p>
              <p className="mt-2 text-sm text-slate-500">Target: {metric.target}</p>
              <p className="mt-1 text-sm text-slate-700">Actual: {metric.actual}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
          {nutritionDiagnosis.recommendation}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-sm font-semibold text-slate-300">Agent action</p>
          <p className="mt-2 text-lg font-semibold">
            {nutritionDiagnosis.agentAction}
          </p>
          <p className="mt-3 text-sm text-slate-300">
            Biggest blocker:{" "}
            <span className="font-semibold text-white">
              {nutritionDiagnosis.biggestBlocker}
            </span>
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="font-semibold">Agent recommendation</p>
          <p className="mt-2 text-sm text-slate-700">
            {nutritionDiagnosis.recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}

function DiagnosisStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
