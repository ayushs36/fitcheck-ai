import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FitCheck Coach Privacy Policy",
  description:
    "Privacy policy for the FitCheck Coach mobile app, including local-only fitness logging and no OpenAI API usage in the mobile client.",
};

export default function MobilePrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          FitCheck Coach
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective date: September 8, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-950">What The App Stores</h2>
            <p className="mt-2">
              FitCheck Coach stores the fitness information you enter, including account
              profile details, goals, weight logs, calories, protein, steps, workouts, exercises,
              notes, and local backup data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Where Data Is Stored</h2>
            <p className="mt-2">
              In the current mobile release, your fitness logs are stored locally on your device.
              FitCheck Coach does not run a public backend account system, does not sell your
              data, and does not use third-party advertising trackers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">OpenAI And API Keys</h2>
            <p className="mt-2">
              The mobile app does not include an OpenAI API key and does not call OpenAI from the
              public mobile client. The separate web app may include protected AI features, but
              those are not part of the public mobile client.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Backups And Reset</h2>
            <p className="mt-2">
              If you export a local backup, you control where that backup is saved or shared. If you
              reset the app, locally stored mobile logs, workouts, goals, settings, and account
              details are removed from that device.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Health Notice</h2>
            <p className="mt-2">
              FitCheck Coach is a fitness logging tool. It is not a medical device and does not
              provide medical diagnosis or treatment advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Contact</h2>
            <p className="mt-2">
              For support or privacy questions, use the support page linked from the App Store
              listing.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
