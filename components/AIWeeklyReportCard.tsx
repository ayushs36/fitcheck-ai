export function AIWeeklyReportCard({
  aiWeeklyReport,
  isWeeklyReportLoading,
  generateAIWeeklyReport,
}: {
  aiWeeklyReport: string;
  isWeeklyReportLoading: boolean;
  generateAIWeeklyReport: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Secondary Report
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Weekly Coaching Report</h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            A saved weekly summary for reviewing trends after the agent has made
            the current decision.
          </p>
        </div>

        <button
          onClick={generateAIWeeklyReport}
          disabled={isWeeklyReportLoading}
          className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 md:w-auto"
        >
          {isWeeklyReportLoading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
          View latest weekly report
        </summary>

        <div className="whitespace-pre-wrap border-t border-slate-200 p-4 text-sm leading-6 text-slate-700">
          {aiWeeklyReport}
        </div>
      </details>
    </section>
  );
}
