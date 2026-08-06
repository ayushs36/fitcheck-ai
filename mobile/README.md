# FitCheck AI Mobile

FitCheck AI Mobile is the App Store-focused consumer app for logging weight, nutrition, steps, and training across cutting, maintaining, and bulking goals. It is intentionally separate from the recruiter-facing web app so mobile development does not affect the deployed AI coaching agent website.

## Day 68 Foundation

- Expo React Native app structure
- TypeScript data models for logs, goals, workouts, and settings
- Bottom tab navigation shell
- Today logging screen with blank inputs by default
- Local device storage boundary for future persistence
- No OpenAI API calls from the mobile app

## Mobile Progress

- Day 1: Created the isolated Expo mobile app shell for App Store-focused development.
- Day 2: Added local log persistence, safe partial logs, today editing, and basic history.
- Day 3: Added past-log editing from the Progress screen with tap-to-edit saved days.

## Product Direction

The mobile app should help beginners through advanced lifters log consistently and understand progress across cutting, maintaining, and bulking goals. The web app remains the AI agent portfolio project; the mobile app is the consumer tracking product designed for App Store release and should never depend on a public OpenAI API key.
