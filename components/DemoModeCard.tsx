export function DemoModeCard({ loadDemoData }: { loadDemoData: () => void }) {
  return (
    <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
      <h2 className="text-2xl font-semibold">Demo Mode</h2>
      <p className="mt-2 text-sm text-slate-300">
        Load public sample data so the dashboard, agent history, charts, and
        analytics are instantly portfolio-ready.
      </p>

      <button
        onClick={loadDemoData}
        className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900"
      >
        Load Demo Data
      </button>
    </section>
  );
}
