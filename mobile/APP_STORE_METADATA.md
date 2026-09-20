# FitCheck Coach App Store Metadata

Cloud listing configuration, reviewer instructions, and private contact details
are maintained in App Store Connect. Privacy labels remain pending until the
final questionnaire is completed and published.

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
backend. Existing device logs are imported only with your confirmation. The app
uses practical, rule-based coaching.

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

## Privacy Questionnaire Draft (September 17)

Implementation-based mapping, not a published or complete declaration:

| Apple category | App evidence | Initial purpose |
| --- | --- | --- |
| Email Address | Apple-provided email in cloud authentication | App Functionality |
| User ID | Apple-linked identity and Supabase account ID | App Functionality |
| Health | Synced weight and nutrition records | App Functionality; review Product Personalization for goal-based guidance |
| Fitness | Synced steps, workouts, exercises and goals | App Functionality; review Product Personalization for goal-based guidance |
| Other User Content | Synced free-text notes | App Functionality |

These records are linked to the account, not anonymized. No advertising tracking
is implemented. Do not equate account sync with Apple's advertising-related
tracking definition. Before publishing, confirm Supabase operational logging and
any additional SDK collection, including applicable diagnostic or other-data
categories. Do not assume those categories are absent merely because there is
no dedicated analytics SDK. Obtain owner approval of the completed declaration.

Sources: [Apple data definitions](https://developer.apple.com/app-store/app-privacy-details/)
and [questionnaire workflow](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).

## Store URLs

- Privacy policy URL: https://fitcheck-ai-psi.vercel.app/mobile-privacy
- Support URL: https://fitcheck-ai-psi.vercel.app/mobile-support
- Marketing URL: https://fitcheck-ai-psi.vercel.app/fitcheck-coach

## App Review Notes

The uploadable instructions are in `store.review.config.js`. The `store-review`
submit profile requires APP_REVIEW_FIRST_NAME, APP_REVIEW_LAST_NAME,
APP_REVIEW_EMAIL, and APP_REVIEW_PHONE supplied privately as environment variables.
Never commit contact values or an exported contact-filled configuration.

FitCheck Coach is a goal-aware fitness logging app with Sign in with Apple and
account sync in the cloud-enabled release. It does not provide medical diagnosis,
sell supplements, collect payment, or include advertising trackers.

Reviewers use Sign in with Apple, keep any existing device logs separate, and
complete goal onboarding. They can then use Today, Progress, Training, Goals,
and Account. Account includes export and deletion, with fresh Apple confirmation
for deletion. Use fictional records during review. Verify this complete flow on
a real device before publishing these notes. Apple review contact details belong
in the private App Store Connect fields, not this repository.
