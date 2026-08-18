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

## Product Direction

The mobile app should help beginners through advanced lifters log consistently and understand progress across cutting, maintaining, and bulking goals. The web app remains the AI agent portfolio project; the mobile app is the consumer tracking product designed for App Store release and should never depend on a public OpenAI API key.
