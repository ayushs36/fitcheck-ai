# FitCheck Coach TestFlight Build Guide

## Prerequisites

- Apple Developer Program membership is active.
- App Store Connect app record exists for bundle ID `com.ayushs36.fitcheckai`.
- Expo account `ayushs36` is available on the Mac that runs the build.
- EAS project `@ayushs36/fitcheck-ai-mobile` is linked in `app.json`.
- No OpenAI API key is stored in the mobile app, `app.json`, EAS secrets, or client source.

## Local Preflight

Run these from the mobile app folder:

```bash
cd mobile
npm install
npm run preflight:release
```

If `npm audit` reports the current Expo transitive `uuid` advisory, do not run
`npm audit fix --force` during release freeze. The forced fix can downgrade Expo
packages and break the SDK 57 dependency set. Prefer Expo SDK updates or
official patches.

Confirm the app still opens in Expo Go before creating the TestFlight build:

```bash
npm start
```

## First iOS Build

Current status is tracked in `RELEASE_STATUS.md`.

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

EAS should handle the signing certificate, provisioning profile, and remote build-number flow. Use the Apple Developer account only through EAS/App Store Connect, not through committed config files.

## Submit To TestFlight

The first FitCheck Coach iOS build has already been uploaded:

- App Store Connect app ID: `6810485632`
- Build ID: `d008b19d-cf55-4739-8cfe-dbdba710c1d5`
- App version: `1.0.0`
- Build number: `5`
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6810485632/testflight/ios`
- App Store listing URL: `https://appstoreconnect.apple.com/apps/6810485632/appstore`

Wait for Apple processing to finish, then open App Store Connect and confirm the build appears under TestFlight.

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
