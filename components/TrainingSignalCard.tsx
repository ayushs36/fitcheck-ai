import type {
  ExerciseHistorySummary,
  ExerciseSignal,
  MuscleGroupTrend,
  TrainingSignal,
  WorkoutTypeTrend,
} from "@/types/fitness";

export function TrainingSignalCard({
  trainingSignal,
}: {
  trainingSignal: TrainingSignal;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Agent Training Signal</h2>
          <p className="mt-2 text-sm text-slate-500">
            Compares repeat exercises using load/volume for weighted lifts and
            total reps for bodyweight work.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
          {trainingSignal.score}/100 - {trainingSignal.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <TrainingStat label="Agent action" value={trainingSignal.agentAction} />
        <TrainingStat
          label="Recent workouts"
          value={`${trainingSignal.workoutFrequency}`}
        />
        <TrainingStat
          label="Latest output"
          value={trainingSignal.latestWorkoutVolume.toFixed(0)}
        />
        <TrainingStat
          label="Volume change"
          value={`${trainingSignal.volumeChange.toFixed(1)}%`}
        />
        <TrainingStat
          label="2-3 week comparisons"
          value={`${trainingSignal.weeklyComparisonCount}`}
        />
        <TrainingStat
          label="Muscle groups"
          value={`${trainingSignal.muscleGroupTrends.length}`}
        />
        <TrainingStat
          label="Decline rate"
          value={`${Math.round(trainingSignal.weeklyDeclineRate * 100)}%`}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="font-semibold">Agent recommendation</p>
        <p className="mt-2 text-sm text-slate-700">
          {trainingSignal.recommendation}
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          {trainingSignal.agentTrainingInsight}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {trainingSignal.trainingBalanceInsight}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SignalList
          title="Recent PRs"
          emptyText="No recent PRs detected yet."
          items={trainingSignal.recentPrs}
        />
        <SignalList
          title="Form Focus"
          emptyText="No form-focused load drops detected."
          items={trainingSignal.formFocusSignals}
        />
        <SignalList
          title="Watch List"
          emptyText="No repeated regressions to watch."
          items={trainingSignal.regressions}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <WorkoutTypeTrendList trends={trainingSignal.workoutTypeTrends} />
        <MuscleGroupTrendList trends={trainingSignal.muscleGroupTrends} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <LiftList title="Improving" lifts={trainingSignal.improvingLifts} />
        <LiftList title="Stalled / Stable" lifts={trainingSignal.stalledLifts} />
        <LiftList title="Declining" lifts={trainingSignal.decliningLifts} />
      </div>

      <ExerciseHistoryList exerciseHistory={trainingSignal.exerciseHistory} />
    </section>
  );
}

function TrainingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SignalList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item} className="rounded-xl bg-white p-3">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkoutTypeTrendList({ trends }: { trends: WorkoutTypeTrend[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">Workout Type Trends</p>

      {trends.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Log workouts with exercises to build trends.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {trends.slice(0, 4).map((trend) => (
            <div key={trend.workout} className="rounded-xl bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">
                  {trend.workout}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {trend.trend}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {trend.sessions} sessions · {trend.previousOutput.toFixed(0)} to{" "}
                {trend.latestOutput.toFixed(0)} output
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MuscleGroupTrendList({ trends }: { trends: MuscleGroupTrend[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">Muscle Group Balance</p>

      {trends.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Log exercises to identify muscle-group coverage.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {trends.slice(0, 6).map((trend) => (
            <div key={trend.muscleGroup} className="rounded-xl bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">
                  {trend.muscleGroup}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {trend.trend}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {trend.sessions} logged entries · last {trend.lastTrainedDate}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {trend.exercises.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiftList({
  title,
  lifts,
}: {
  title: string;
  lifts: ExerciseSignal[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>

      {lifts.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No matching lifts yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {lifts.slice(0, 4).map((lift) => (
            <div key={`${title}-${lift.name}`} className="rounded-xl bg-white p-3">
              <p className="text-sm font-semibold text-slate-950">{lift.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {lift.progressionBasis}:{" "}
                {lift.progressionBasis === "Bodyweight reps"
                  ? `${lift.previousTotalReps} to ${lift.latestTotalReps} reps`
                  : `${lift.previousVolume.toFixed(0)} to ${lift.latestVolume.toFixed(0)}`}
                {lift.progressionBasis === "Bodyweight reps"
                  ? ` (${lift.repChange > 0 ? "+" : ""}${lift.repChange})`
                  : ` (${lift.volumeChange.toFixed(0)})`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseHistoryList({
  exerciseHistory,
}: {
  exerciseHistory: ExerciseHistorySummary[];
}) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-950">Lift History</p>
          <p className="mt-1 text-sm text-slate-500">
            Recent exercise summaries based on your logged sessions.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {exerciseHistory.length} tracked lifts
        </span>
      </div>

      {exerciseHistory.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Add repeat exercises to build lift history.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {exerciseHistory.slice(0, 6).map((exercise) => (
            <div key={exercise.name} className="rounded-xl bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {exercise.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {exercise.sessions} sessions · last logged{" "}
                    {exercise.lastLoggedDate}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {exercise.trend}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Best weight {exercise.bestWeight.toFixed(0)} lbs · best reps{" "}
                {exercise.bestTotalReps} · output{" "}
                {exercise.previousOutput.toFixed(0)} to{" "}
                {exercise.latestOutput.toFixed(0)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
