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
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Ask FitCheck AI</h2>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          className="w-full rounded-2xl border border-slate-200 p-3"
          value={coachQuestion}
          onChange={(event) => setCoachQuestion(event.target.value)}
          placeholder="Example: Am I on track to reach my goal?"
        />

        <button
          onClick={askFitCheckAILLM}
          disabled={isCoachLoading}
          className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isCoachLoading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-slate-700">
        <p className="font-semibold">FitCheck AI Response</p>
        <p className="mt-2">{coachAnswer}</p>
      </div>
    </section>
  );
}