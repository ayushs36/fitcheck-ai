import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FitCheck AI Mobile Support",
  description:
    "Support information for FitCheck AI Mobile, including setup, logging, backups, privacy, and TestFlight/App Store help.",
};

const supportItems = [
  {
    title: "Getting Started",
    body: "Open the app, create the local profile, choose cutting, maintaining, or bulking, then log only the fields you know each day.",
  },
  {
    title: "Blank Fields",
    body: "Blank weight, calories, protein, steps, and workout fields are treated as unknown. They are skipped in averages instead of counted as zero.",
  },
  {
    title: "Backups",
    body: "Use Settings to export a local backup before changing devices, testing reset, or reinstalling the app.",
  },
  {
    title: "Privacy",
    body: "The mobile app stores logs on-device in the current release and does not include an OpenAI API key in the public client.",
  },
];

export default function MobileSupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          FitCheck AI Mobile
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Support</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Help for the public mobile app focused on weight, nutrition, steps, workout logging, and
          goal-aware progress tracking.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {supportItems.map((item) => (
            <article key={item.title} className="rounded-2xl bg-slate-100 p-4">
              <h2 className="font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <h2 className="font-semibold text-slate-950">Need Help?</h2>
          <p className="mt-2">
            Include your device model, iOS version, app version, and a short description of what you
            were trying to do. Do not send sensitive health information unless it is required to
            explain the issue.
          </p>
        </div>
      </section>
    </main>
  );
}
