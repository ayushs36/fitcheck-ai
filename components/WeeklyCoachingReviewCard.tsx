import type { WeeklyCoachingReview } from "@/types/fitness";

export function WeeklyCoachingReviewCard({
  review,
}: {
  review: WeeklyCoachingReview;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Agent Weekly Review
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            {review.agentPriority}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{review.weekRange}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
            {review.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {review.confidence} confidence
          </span>
        </div>
      </div>

      <div className="mt-5 border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium leading-6 text-emerald-950">
          {review.summary}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReviewPanel label="Biggest Change" value={review.biggestChange} />
        <ReviewPanel label="Biggest Blocker" value={review.biggestBlocker} />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Next 7 Days
        </p>
        <ol className="mt-3 space-y-2 text-sm leading-6">
          {review.nextActions.map((action, index) => (
            <li key={action} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-xs font-bold text-slate-950">
                {index + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {review.evidence.map((item) => (
          <span
            key={item}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ReviewPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}
