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
- Day 4: Added workout session logging with exercises, sets, reps, weight, bodyweight sets, and form-focus tracking.
- Day 5: Added workout-type exercise templates, custom exercise entry, Use Last Workout, and a simplified rest-day flow.
- Day 6: Added saved goal setup for cutting, maintaining, and bulking with weight, pace, calorie, protein, and step targets.
- Day 7: Added a goal-aware Progress dashboard with weight trend, nutrition/activity averages, and missing-data-safe calculations.
- Day 8: Added compact Progress charts for weight, calories, steps, and a strength trend preview from saved workouts.
- Day 9: Added goal-aware next actions for cutting, maintaining, and bulking based on trends, targets, and logging quality.
- Day 10: Added training analytics that separate weighted, bodyweight, and form-focus work so volume changes are interpreted with context.
- Day 11: Added first-launch onboarding for units, goal setup, starting weight, targets, and blank-field guidance.
- Day 12: Added Settings data management with local data summary, backup export, privacy context, and guarded reset.
- Day 13: Added logging quality scoring so Progress can judge whether recent weight, nutrition, and step data are strong enough for reliable coaching.
- Day 14: Added a local Coach Brief on Today so users see goal-aware priority, next action, trend, and logging quality before saving a log.
- Day 15: Made mobile unit support real across daily weigh-ins, past-log editing, recent logs, trend displays, charts, and workout set weights.
- Day 16: Added guarded delete controls for accidental daily logs and workout sessions so users can correct data without resetting the app.
- Day 22: Added a compact goal timeline to Progress with current weight, target weight, remaining change, planned date, projected date, and goal-aware next action.
- Day 23: Added weekly target checks to the Today coach brief so calories, protein, and steps are evaluated before logging without adding another card.
- Day 24: Added a 14-log mobile nutrition diagnosis inside Progress so calorie and protein reliability are judged separately from quick weekly averages.
- Day 25: Added last-performance previews while logging exercises so repeated movements show recent sets, reps, load, and form-focus context.
- Day 26: Added repeat-exercise trend summaries to Training Analytics so recent performance is judged by matching exercises, bodyweight work, and form-focus context.
- Day 27: Simplified the Today coach brief with a compact weekly execution check so mobile users get clear goal-aware guidance without an overloaded screen.
- Day 28: Started release freeze work with App Store/TestFlight configuration, branded launch assets, build numbers, privacy flags, and a focused submission checklist.
- Day 29: Added an account setup gate, account storage, backup-aware account metadata, and private-AI guardrails that keep OpenAI access backend-only instead of embedding a key in the app.
- Day 30: Added Settings account management so users can edit their local profile or sign out without deleting logs, keeping mobile public-app ready while remaining API-key free.
- Day 31: Completed a release-readiness pass with version `1.0.0`, a compact Settings readiness summary, and QA checklist confirmation that the mobile client remains API-key free.

## Product Direction

The mobile app should help beginners through advanced lifters log consistently and understand progress across cutting, maintaining, and bulking goals. The web app remains the AI agent portfolio project; the mobile app is the consumer tracking product designed for App Store release and should never depend on a public OpenAI API key.
