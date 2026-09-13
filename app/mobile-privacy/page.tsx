import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FitCheck Coach Privacy Policy",
  description:
    "Privacy policy for FitCheck Coach, covering device storage, Apple-linked cloud accounts, backups, and account deletion.",
};

export default function MobilePrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          FitCheck Coach
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: September 12, 2026</p>

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
              Local-only versions, including TestFlight build 5, store fitness logs on your
              device. Cloud-enabled versions use Sign in with Apple and Supabase to store
              account-linked records and sync them between your devices. They also keep a
              device cache. Existing device logs are imported only after your confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Cloud Accounts And Use Of Data</h2>
            <p className="mt-2">
              Cloud accounts use your Apple-linked identifier and the email address Apple
              provides, which may be a private-relay address. Fitness logs, goals, workout
              records, and notes you save in that account are sent to the mobile backend for
              storage and synchronization. Authentication state is stored using the
              device&apos;s secure storage. Service providers process connection and operational
              information to run these services. FitCheck Coach does not sell your data or
              use third-party advertising trackers. Mobile records are separate from the
              FitCheck AI web demo.
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
            <h2 className="text-lg font-semibold text-slate-950">Backups And Deletion</h2>
            <p className="mt-2">
              You control where exported backups are saved or shared. In cloud-enabled
              versions, Account includes an account-deletion request with fresh Apple
              confirmation. Successful deletion removes your active cloud account and its
              synced records, revokes Apple authorization, and clears that account&apos;s
              active cache on the requesting device. Interrupted device cleanup may require
              a retry. Signing out is not account deletion.
            </p>
            <p className="mt-2">
              Original device logs, saved import backups, exported files, and caches on other
              devices are not automatically erased by this action. Manage those copies on
              each device or wherever you saved them. Deletion from the active database does
              not promise immediate erasure from service-provider backups or operational logs.
              Contact us for help with retained copies or a failed deletion request.
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
              For support or privacy questions, visit the{" "}
              <Link href="/mobile-support" className="font-medium text-blue-700 underline underline-offset-4">
                FitCheck Coach support page
              </Link>.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
