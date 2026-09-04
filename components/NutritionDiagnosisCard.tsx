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
            Compares your last 7 and 14 saved logs, while skipping blank calorie
            and protein fields, so short-term behavior and reliable trends stay
            separate.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {nutritionDiagnosis.score}/100 - {nutritionDiagnosis.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <DiagnosisStat
          label="7-log calorie avg"
          value={
            nutritionDiagnosis.calorieAverage7 > 0
              ? `${nutritionDiagnosis.calorieAverage7.toFixed(0)} cal`
              : "Need data"
          }
        />
        <DiagnosisStat
          label="14-log calorie avg"
          value={
            nutritionDiagnosis.calorieAverage > 0
              ? `${nutritionDiagnosis.calorieAverage.toFixed(0)} cal`
              : "Need data"
          }
        />
        <DiagnosisStat
          label="7-log protein avg"
          value={
            nutritionDiagnosis.proteinAverage7 > 0
              ? `${nutritionDiagnosis.proteinAverage7.toFixed(0)}g`
              : "Need data"
          }
        />
        <DiagnosisStat
          label="14-log protein avg"
          value={
            nutritionDiagnosis.proteinAverage > 0
              ? `${nutritionDiagnosis.proteinAverage.toFixed(0)}g`
              : "Need data"
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
        <span>
          Target:{" "}
          {nutritionDiagnosis.calorieTarget > 0
            ? `${nutritionDiagnosis.calorieTarget.toFixed(0)} cal`
            : "Need data"}
        </span>
        <span>Hit rate: {Math.round(nutritionDiagnosis.calorieTargetHitRate * 100)}%</span>
        <span>
          Consistency:{" "}
          {nutritionDiagnosis.calorieVariance > 0
            ? `${nutritionDiagnosis.calorieVariance.toFixed(0)} cal swing`
            : "Need data"}
        </span>
        <span>Under-logging: {nutritionDiagnosis.underLoggingRisk}</span>
        <span>Volatility: {nutritionDiagnosis.volatileIntakeRisk}</span>
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
          FitCheck needs at least 7 recent logs and 5 calorie logs inside the
          14-log window before the reliable diagnosis becomes useful.{" "}
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
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {nutritionDiagnosis.nutritionNextAction}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {nutritionDiagnosis.agentNutritionInsight}
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
