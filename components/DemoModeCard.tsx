import { demoScenario } from "@/lib/demoData";

export function DemoModeCard({ loadDemoData }: { loadDemoData: () => void }) {
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
        Load / Reset Demo
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        First-time public visitors see fictional demo data automatically. This
        button resets the local browser to the same demo dataset. Public AI
        actions use protected demo responses unless live AI is explicitly
        enabled on the server.
      </p>
    </section>
  );
}
