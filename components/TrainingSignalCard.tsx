import type { ExerciseSignal, TrainingSignal } from "@/types/fitness";

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
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="font-semibold">Agent recommendation</p>
        <p className="mt-2 text-sm text-slate-700">
          {trainingSignal.recommendation}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <LiftList title="Improving" lifts={trainingSignal.improvingLifts} />
        <LiftList title="Stalled / Stable" lifts={trainingSignal.stalledLifts} />
        <LiftList title="Declining" lifts={trainingSignal.decliningLifts} />
      </div>
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
