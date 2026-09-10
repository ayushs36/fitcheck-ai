# FitCheck Coach App Store Checklist

## Day 28 Release Freeze

- Core logging is local-only: weight, calories, protein, steps, workout type, exercises, sets, reps, load, form-focus, and notes.
- Mobile does not include an OpenAI API key and does not call the web app's OpenAI routes.
- Account setup exists before onboarding. Production Sign in with Apple/Google should replace the local account provider before enabling cloud sync or public server accounts.
- Account management exists in Settings so users can edit their local profile or sign out without deleting logs.
- Private OpenAI access must go through a protected backend allowlist. Never ship an OpenAI API key inside the mobile client.
- Missing fields stay blank and are skipped in averages.
- Cutting, maintaining, and bulking goals drive the coaching summaries.
- App identity is configured with bundle ID `com.ayushs36.fitcheckai`.
- App icon, adaptive icon, splash image, Android version code, remote EAS build numbering, and encryption declaration are configured.

## Before TestFlight

- Day 31 QA pass completed: mobile version is set to `1.0.0`, Settings surfaces release/privacy status, and the client still has no OpenAI API key or OpenAI route calls.
- Day 32 App Store Connect prep completed: listing copy, category, age-rating assumptions, keywords, privacy labels, and review notes are drafted in `APP_STORE_METADATA.md`.
- Day 33 TestFlight build path completed: EAS build and submit scripts are in `package.json`, and the exact first-build flow is documented in `TESTFLIGHT_BUILD_GUIDE.md`.
- Day 34 EAS preflight completed: EAS CLI is reachable and build scripts call it through `npx eas-cli`.
- Day 35 release QA completed: Expo SDK dependencies were aligned, splash config was moved to the SDK 57 plugin format, and `npm run preflight:release` passes with Expo Doctor at 21/21 checks.
- Day 36 listing infrastructure completed: public privacy/support pages were added, App Store metadata now includes those URLs, and screenshot guidance is drafted in `APP_STORE_SCREENSHOTS.md`.
- Day 37 release execution check completed: `npm run preflight:release` passes, this Mac is logged into Expo as `ayushs36`, and the app is linked to EAS project `@ayushs36/fitcheck-ai-mobile`.
- Day 38 release freeze completed: EAS remote versioning is configured, local iOS build-number noise was removed, and the only current release blocker is Apple Developer Program approval before iOS signing/TestFlight submission.
- V1 release status: Apple Developer Program is verified, code is feature-frozen, and iOS build `1.0.0` / `5` has finished processing, is available in TestFlight, and is attached to the App Store release.
- September 10 listing setup: description, subtitle, category, keywords, support URL, copyright, wellness age rating, content rights, non-medical-device declaration, and published Data Not Collected disclosure completed. Free pricing and worldwide availability were approved by the owner and saved.
- Private App Review contact details and review instructions are saved. The public support page now includes the approved support email.
- Outstanding submission requirements: iPhone and iPad screenshots. Device QA remains unverified. Cloud accounts and backup are planned for the next work session before public launch; build 5 remains local-only. The app is not submitted for review.
- Copy or confirm the prepared subtitle, category, keywords, privacy labels, and review notes in App Store Connect.
- Do a final App Store and trademark name check before submission. The current working name is related to the web project, but the public mobile listing should use a distinctive name/subtitle if Apple or trademark search shows conflict.
- Use only original launch assets. The current icon is generated specifically for this project, uses an abstract check/progress mark, and avoids copied logos, text, brand marks, people, and third-party imagery.
- Prepare privacy labels: fitness logs are stored on-device, no third-party tracking, no OpenAI API in mobile.
- Capture App Store screenshots using fictional data only.
- Use the latest uploaded iOS build: `d008b19d-cf55-4739-8cfe-dbdba710c1d5`.
- Install the TestFlight build on a real iPhone and test onboarding, saving, editing, deleting, backup, restore, and reset.
- Test account creation, backup export/restore with account metadata, and reset returning to the account screen.
- Test sign out returning to the account screen while preserving local logs.

## Submission Rule

Only fix release blockers after this point: crashes, broken save/edit/delete flows, confusing copy, layout issues, app identity, and App Store metadata.
