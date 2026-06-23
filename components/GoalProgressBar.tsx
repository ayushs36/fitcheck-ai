export function GoalProgressBar({
  progress,
  startWeight,
  currentWeight,
  goalWeight,
}: {
  progress: number;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Goal Progress</p>
          <p className="mt-1 text-2xl font-bold">{progress}%</p>
        </div>

        <div className="text-right text-sm text-slate-500">
          <p>Start: {startWeight.toFixed(1)} lbs</p>
          <p>Current Avg: {currentWeight.toFixed(1)} lbs</p>
          <p>Goal: {goalWeight.toFixed(1)} lbs</p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}