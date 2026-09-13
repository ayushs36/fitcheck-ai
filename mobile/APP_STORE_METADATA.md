# FitCheck Coach App Store Metadata

Cloud-release draft for build 6. These changes have not been published to App
Store Connect. Replace the older local-only listing and privacy declarations only
after cloud QA and owner review. Build 5 remains local-only.

## Listing

- App name: FitCheck Coach
- Subtitle: Fitness logging for goals
- Category: Health & Fitness
- Age rating: Apple calculated 9+ after declaring Health or Wellness Topics on September 10, 2026; regional and older-OS ratings differ.
- Machine-readable listing: `store.config.json` contains the current description, subtitle, keywords, category, and support/privacy URLs.

## Short Description

FitCheck Coach helps people log weight, calories, protein, steps, and workouts while keeping progress tied to a cutting, maintaining, or bulking goal.

## Full Description

FitCheck Coach is a fitness logging app for people who want a cleaner way to track weight, nutrition, steps, and training progress around a clear goal.

Choose whether you are cutting, maintaining, or bulking, then log only what you know each day. Blank fields stay blank and are skipped in averages, so missing a weigh-in, calories, protein, steps, or workout does not distort your trends.

The app summarizes recent weight movement, calorie and protein consistency, step averages, goal timeline, training history, and repeated exercise performance. It is designed to help beginners through advanced lifters understand whether their current routine matches their goal without forcing every feature onto one screen.

Sign in with Apple to keep your fitness records connected to your account. The
cloud-enabled app caches records on your device and syncs them to its mobile
backend. Existing device logs are imported only with your confirmation. The
mobile app uses rule-based coaching and does not make OpenAI API calls.

## Keywords

weight,calorie,protein,steps,workout,tracker,strength,reps,cutting,bulking,maintenance,goals

## Promotional Text

Track weight, nutrition, steps, and workouts around your current fitness goal.

## What's New

Initial cloud-enabled release with goal-aware logging, progress trends, workout
tracking, Sign in with Apple, account sync, backup export, and account deletion.

## Privacy Labels

- Third-party tracking: No
- Cloud privacy declaration requires owner review before publication. Do not use
  "Data Not Collected" for the cloud-enabled release.
- Account-linked data: Apple-linked account identifier and email (including an
  Apple private-relay address), plus fitness logs, goals, workout records, and
  user-entered notes. Used for account access, sync, and app functionality.
- Device data: cached fitness records, secure authentication state, and retained
  original logs/import backups. Exported backups remain wherever the user saves them.
- Review Apple's Health/Fitness, User ID, Email Address, and user-content
  categories against the final implementation; this draft is not a completed
  App Store privacy questionnaire.
- OpenAI/API usage: The mobile app does not include an OpenAI API key and does not call OpenAI from the public client.

## URLs To Prepare Before Submission

- Privacy policy URL: https://fitcheck-ai-psi.vercel.app/mobile-privacy
- Support URL: https://fitcheck-ai-psi.vercel.app/mobile-support
- Marketing URL: omitted; the web demo is a separate product.

## App Review Notes

FitCheck Coach is a goal-aware fitness logging app with Sign in with Apple and
account sync in the cloud-enabled release. It does not provide medical diagnosis,
sell supplements, collect payment, include advertising trackers, or use OpenAI.

Reviewers use Sign in with Apple, keep any existing device logs separate, and
complete goal onboarding. They can then use Today, Progress, Training, Goals,
and Account. Account includes export and deletion, with fresh Apple confirmation
for deletion. Use fictional records during review. Verify this complete flow on
a real device before publishing these notes. Apple review contact details belong
in the private App Store Connect fields, not this repository.
