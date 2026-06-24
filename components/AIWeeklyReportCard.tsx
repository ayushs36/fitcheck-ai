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
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">AI Weekly Report Generator</h2>

      <p className="mt-2 text-sm text-slate-500">
        Generates a full AI-powered weekly coaching report using your fitness
        data.
      </p>

      <button
        onClick={generateAIWeeklyReport}
        disabled={isWeeklyReportLoading}
        className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {isWeeklyReportLoading
          ? "Generating..."
          : "Generate AI Weekly Report"}
      </button>

      <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-slate-700">
        {aiWeeklyReport}
      </div>
    </section>
  );
}