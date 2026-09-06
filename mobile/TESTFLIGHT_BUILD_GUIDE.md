# FitCheck AI TestFlight Build Guide

## Prerequisites

- Apple Developer Program membership is active.
- App Store Connect app record exists for bundle ID `com.ayushs36.fitcheckai`.
- Expo account is available on the Mac that runs the build.
- No OpenAI API key is stored in the mobile app, `app.json`, EAS secrets, or client source.

## Local Preflight

Run these from the mobile app folder:

```bash
cd mobile
npm install
npm run typecheck
```

Confirm the app still opens in Expo Go before creating the TestFlight build:

```bash
npm start
```

## First iOS Build

Log in to Expo:

```bash
npx eas-cli login
```

Confirm the login:

```bash
npx eas-cli whoami
```

Create or refresh native credentials if EAS asks for them:

```bash
npx eas-cli build:configure
```

Create the iOS production build:

```bash
npm run build:ios:testflight
```

EAS should handle the signing certificate and provisioning profile flow. Use the Apple Developer account only through EAS/App Store Connect, not through committed config files.

## Submit To TestFlight

After the build finishes:

```bash
npm run submit:ios:testflight
```

Then open App Store Connect and confirm the build appears under TestFlight.

## First TestFlight QA

- Fresh install opens account setup.
- Onboarding saves units, goal, starting weight, targets, and blank fields correctly.
- Today saves partial logs without converting blanks to zero.
- Progress updates charts, 7-log averages, 14-log diagnosis, and goal timeline.
- Training saves weighted, bodyweight, and form-focus sets.
- Editing and deleting past logs works.
- Backup export/restore preserves logs, workouts, settings, and local account metadata.
- Sign out keeps local logs.
- Reset clears local logs and returns to account setup.

## Release Guardrails

- Do not add OpenAI API calls to the mobile client.
- Do not add a public API key to the app bundle.
- Do not add new product features during TestFlight unless they fix a release blocker.
- Keep App Store screenshots based on fictional data.
