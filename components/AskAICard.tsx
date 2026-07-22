export function AskAICard({
  coachQuestion,
  setCoachQuestion,
  coachAnswer,
  isCoachLoading,
  askFitCheckAILLM,
}: {
  coachQuestion: string;
  setCoachQuestion: (value: string) => void;
  coachAnswer: string;
  isCoachLoading: boolean;
  askFitCheckAILLM: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <details>
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Secondary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Ask FitCheck AI
              </h2>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Free-form chat
            </span>
          </div>
        </summary>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            value={coachQuestion}
            onChange={(event) => setCoachQuestion(event.target.value)}
            placeholder="Example: Am I on track to reach my goal?"
          />

          <button
            onClick={askFitCheckAILLM}
            disabled={isCoachLoading}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isCoachLoading ? "Thinking..." : "Ask AI"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-950">FitCheck AI Response</p>
          <p className="mt-2">{coachAnswer}</p>
        </div>
      </details>
    </section>
  );
}
