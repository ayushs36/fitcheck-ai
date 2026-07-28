import { demoScenario } from "@/lib/demoData";

export function DemoModeCard({
  isDemoPreview,
  loadDemoData,
}: {
  isDemoPreview: boolean;
  loadDemoData: () => void;
}) {
  return (
    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Portfolio Demo
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{demoScenario.title}</h2>
      <p className="mt-2 text-sm font-semibold text-emerald-300">
        {demoScenario.profile}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {demoScenario.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Fictional data
        </span>
        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
          Local browser storage
        </span>
        <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
          Protected AI calls
        </span>
        {isDemoPreview && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            Preview mode
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-2">
        {demoScenario.highlights.map((highlight) => (
          <div
            key={highlight}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            {highlight}
          </div>
        ))}
      </div>

      <button
        onClick={loadDemoData}
        className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-100"
      >
        Preview Fictional Demo
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        First-time visitors see fictional demo data automatically. The public
        demo link can force this clean state even if a browser has old local
        data. Preview mode does not overwrite saved personal logs.
      </p>
    </section>
  );
}
