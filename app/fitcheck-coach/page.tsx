import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FitCheck Coach | Goal-Aware Fitness Logging",
  description:
    "FitCheck Coach is a private, goal-aware iPhone app for logging weight, nutrition, steps, workouts, and progress.",
};

const features = [
  {
    title: "Log the essentials",
    body: "Record weight, calories, protein, steps, workouts, exercises, sets, reps, and notes without forcing every field every day.",
  },
  {
    title: "Follow the trend",
    body: "See weight, calorie, and step history with goal-aware progress signals built around your real logged data.",
  },
  {
    title: "Train with context",
    body: "Review prior performance for repeat exercises, including bodyweight and form-focused work, before your next session.",
  },
  {
    title: "Keep control of your data",
    body: "Sign in with Apple to keep records private and sync them between your own devices. Export and account-deletion controls are included.",
  },
];

export default function FitCheckCoachPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#102a4c]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <Link href="/fitcheck-coach" className="flex items-center gap-3 font-semibold text-[#102a4c]">
          <Image src="/fitcheck-coach-icon.png" alt="FitCheck Coach" width={36} height={36} className="rounded-[9px]" />
          FitCheck Coach
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-[#38536f]">
          <Link href="/mobile-support" className="hover:text-[#1769a8]">Support</Link>
          <Link href="/mobile-privacy" className="hover:text-[#1769a8]">Privacy</Link>
        </nav>
      </header>

      <section className="border-y border-[#d5e1ec] bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1769a8]">Fitness logging for real life</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[#102a4c] sm:text-5xl">
              FitCheck Coach
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#38536f]">
              A focused iPhone app for people who want to log nutrition and training, understand their trend, and stay aligned with a cutting, maintaining, or bulking goal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
              <a href="#features" className="rounded-[8px] bg-[#1769a8] px-5 py-3 text-white hover:bg-[#12598f]">Explore features</a>
              <Link href="/mobile-support" className="rounded-[8px] border border-[#d5e1ec] px-5 py-3 text-[#102a4c] hover:border-[#1769a8]">Get support</Link>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#5f738b]">Coming soon to the App Store. No public API key or AI feature is included in the mobile app.</p>
          </div>

          <div className="justify-self-center">
            <Image
              src="/fitcheck-coach-icon.png"
              alt="FitCheck Coach app icon"
              width={360}
              height={360}
              priority
              className="w-[220px] drop-shadow-[0_24px_28px_rgba(16,42,76,0.18)] sm:w-[300px]"
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16 sm:px-8 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1769a8]">Built to stay useful</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#102a4c]">Simple daily logging. Better weekly context.</h2>
        <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {features.map((feature, index) => (
            <article key={feature.title} className="border-t border-[#d5e1ec] pt-5">
              <p className="text-sm font-semibold text-[#1769a8]">0{index + 1}</p>
              <h3 className="mt-2 text-xl font-semibold text-[#102a4c]">{feature.title}</h3>
              <p className="mt-2 max-w-lg leading-7 text-[#5f738b]">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d5e1ec] bg-[#eaf1f7]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1769a8]">Private by design</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[#102a4c]">Your logs stay yours.</h2>
            <p className="mt-4 max-w-xl leading-7 text-[#38536f]">
              FitCheck Coach supports Apple-linked accounts for private device-to-device sync. Blank fields stay unknown, and the app never turns missing entries into zeros.
            </p>
          </div>
          <div className="self-center border-l-2 border-[#078a78] pl-5 text-lg leading-8 text-[#102a4c]">
            The mobile app is a logging and progress tool, not medical advice. It does not include an OpenAI API key or use a public AI service.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-normal text-[#102a4c]">Need help with FitCheck Coach?</h2>
        <p className="mt-3 max-w-2xl leading-7 text-[#5f738b]">Find setup, backup, privacy, and troubleshooting information, or contact support directly.</p>
        <div className="mt-7 flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/mobile-support" className="text-[#1769a8] underline underline-offset-4">Open support</Link>
          <Link href="/mobile-privacy" className="text-[#1769a8] underline underline-offset-4">Read the privacy policy</Link>
        </div>
      </section>
    </main>
  );
}
