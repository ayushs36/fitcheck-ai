import type { GoalAdaptation, GoalAdaptationRecord } from "@/types/fitness";

export function GoalAdaptationCard({
  goalAdaptation,
  applyGoalDate,
  applyCalories,
  rejectGoalAdaptation,
  currentGoalDate,
  currentGoalWeight,
  adaptationHistory,
}: {
  goalAdaptation: GoalAdaptation;
  applyGoalDate: () => void;
  applyCalories: () => void;
  rejectGoalAdaptation: () => void;
  currentGoalDate: string;
  currentGoalWeight: number;
  adaptationHistory: GoalAdaptationRecord[];
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Goal Adaptation</h2>
          <p className="mt-2 text-sm text-slate-500">
            Adjusts the goal date or calorie target when the current plan is no
            longer realistic.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {goalAdaptation.confidence} confidence
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-500">Status</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {goalAdaptation.status}
        </p>
        <p className="mt-3 text-slate-700">{goalAdaptation.recommendation}</p>
        <p className="mt-2 text-sm text-slate-500">{goalAdaptation.reason}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Goal Date
          </p>
          <p className="mt-1 font-semibold text-slate-900">{currentGoalDate}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Goal Weight
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {currentGoalWeight.toFixed(1)} lbs
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <AdjustmentButton
          label="Suggested Goal Date"
          value={goalAdaptation.suggestedGoalDate ?? "No date change"}
          onClick={applyGoalDate}
          disabled={!goalAdaptation.suggestedGoalDate}
        />
        <AdjustmentButton
          label="Suggested Calories"
          value={
            goalAdaptation.suggestedCalories
              ? `${goalAdaptation.suggestedCalories} cal/day`
              : "Need more data"
          }
          onClick={applyCalories}
          disabled={!goalAdaptation.suggestedCalories}
        />
      </div>

      <button
        onClick={rejectGoalAdaptation}
        className="mt-3 w-full rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
      >
        Reject Current Suggestion
      </button>

      {adaptationHistory.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-100 p-4">
          <p className="font-semibold text-slate-900">Adaptation History</p>

          <div className="mt-3 space-y-3">
            {adaptationHistory.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-3 text-sm">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="font-semibold text-slate-900">
                    {item.status} {item.changeType}
                  </p>
                  <p className="text-slate-500">{item.createdAt}</p>
                </div>

                <p className="mt-2 text-slate-700">{item.reason}</p>
                <p className="mt-2 text-slate-500">
                  Previous: {item.previousGoalWeight.toFixed(1)} lbs by{" "}
                  {item.previousGoalDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AdjustmentButton({
  label,
  value,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl bg-slate-900 p-4 text-left text-white disabled:bg-slate-100 disabled:text-slate-500"
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </button>
  );
}
