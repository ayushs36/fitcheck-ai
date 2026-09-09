# FitCheck AI Mobile

FitCheck AI Mobile is the App Store-focused consumer app for logging weight, nutrition, steps, and training across cutting, maintaining, and bulking goals. It is intentionally separate from the recruiter-facing web app so mobile development does not affect the deployed AI coaching agent website.

## Current Status

- Release version: `1.0.0`
- Expo SDK: 57
- EAS project: `@ayushs36/fitcheck-ai-mobile`
- Bundle ID: `com.ayushs36.fitcheckai`
- Versioning: EAS remote auto-incrementing
- Release preflight: `npm run preflight:release`
- Current blocker: Apple Developer Program enrollment must be approved before the first TestFlight build can be completed.

## Core Features

- Goal setup for cutting, maintaining, and bulking
- Daily logs for weight, calories, protein, steps, and workouts
- Blank-field handling so missing values are skipped instead of counted as zero
- Progress charts for weight, calories, and steps
- 7-log and 14-log averages for recent trend context
- Goal timeline and goal-aware next action
- Workout logging with weighted, bodyweight, and form-focus context
- Past-log editing, delete controls, local backup, restore, and reset
- Local account setup and account management
- On-device storage with no public OpenAI API key or OpenAI client calls

## Product Direction

The mobile app should help beginners through advanced lifters log consistently and understand progress across cutting, maintaining, and bulking goals. The web app remains the AI agent portfolio project; the mobile app is the consumer tracking product designed for App Store release and should never depend on a public OpenAI API key.

## Release Notes

- App Store metadata is drafted in `APP_STORE_METADATA.md`.
- TestFlight instructions are tracked in `TESTFLIGHT_BUILD_GUIDE.md`.
- Release status is tracked in `RELEASE_STATUS.md`.
- Privacy and support pages are available through the web app at `/mobile-privacy` and `/mobile-support`.
