import type { CheckInEntry, CheckInSummary } from "@/types/fitness";

export function CheckInCard({
  checkInEntry,
  setCheckInEntry,
  checkInSummary,
  saveCheckIn,
  clearCheckIns,
}: {
  checkInEntry: CheckInEntry;
  setCheckInEntry: (entry: CheckInEntry) => void;
  checkInSummary: CheckInSummary;
  saveCheckIn: () => void;
  clearCheckIns: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Agent Check-In</h2>
          <p className="mt-2 text-sm text-slate-500">
            Captures hunger, sleep, soreness, energy, and stress for readiness-aware coaching.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {checkInSummary.status}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-500">Readiness Score</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">
          {checkInSummary.readinessScore}/100
        </p>
        <p className="mt-2 text-sm text-slate-700">
          {checkInSummary.recommendation}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <CheckInSlider
          label="Hunger"
          value={checkInEntry.hunger}
          onChange={(value) => setCheckInEntry({ ...checkInEntry, hunger: value })}
        />
        <CheckInSlider
          label="Sleep Quality"
          value={checkInEntry.sleepQuality}
          onChange={(value) =>
            setCheckInEntry({ ...checkInEntry, sleepQuality: value })
          }
        />
        <CheckInSlider
          label="Soreness"
          value={checkInEntry.soreness}
          onChange={(value) =>
            setCheckInEntry({ ...checkInEntry, soreness: value })
          }
        />
        <CheckInSlider
          label="Energy"
          value={checkInEntry.energy}
          onChange={(value) => setCheckInEntry({ ...checkInEntry, energy: value })}
        />
        <CheckInSlider
          label="Stress"
          value={checkInEntry.stress}
          onChange={(value) => setCheckInEntry({ ...checkInEntry, stress: value })}
        />

        <textarea
          className="w-full rounded-2xl border border-slate-200 p-3"
          value={checkInEntry.notes}
          onChange={(event) =>
            setCheckInEntry({ ...checkInEntry, notes: event.target.value })
          }
          placeholder="Optional note"
          rows={3}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={saveCheckIn}
            className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            Save Check-In
          </button>

          <button
            onClick={clearCheckIns}
            className="rounded-2xl bg-red-100 px-4 py-3 font-semibold text-red-700"
          >
            Clear Check-Ins
          </button>
        </div>
      </div>
    </section>
  );
}

function CheckInSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {value}/5
        </span>
      </div>
      <input
        className="w-full"
        min={1}
        max={5}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
