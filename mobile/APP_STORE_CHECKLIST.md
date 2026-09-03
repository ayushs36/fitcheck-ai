# FitCheck AI Mobile App Store Checklist

## Day 28 Release Freeze

- Core logging is local-only: weight, calories, protein, steps, workout type, exercises, sets, reps, load, form-focus, and notes.
- Mobile does not include an OpenAI API key and does not call the web app's OpenAI routes.
- Account setup exists before onboarding. Production Sign in with Apple/Google should replace the local account provider before enabling cloud sync or public server accounts.
- Account management exists in Settings so users can edit their local profile or sign out without deleting logs.
- Private OpenAI access must go through a protected backend allowlist. Never ship an OpenAI API key inside the mobile client.
- Missing fields stay blank and are skipped in averages.
- Cutting, maintaining, and bulking goals drive the coaching summaries.
- App identity is configured with bundle ID `com.ayushs36.fitcheckai`.
- App icon, adaptive icon, splash image, iOS build number, Android version code, and encryption declaration are configured.

## Before TestFlight

- Day 31 QA pass completed: mobile version is set to `1.0.0`, Settings surfaces release/privacy status, and the client still has no OpenAI API key or OpenAI route calls.
- Create or confirm the App Store Connect app record.
- Confirm the public app name, subtitle, category, and age rating.
- Do a final App Store and trademark name check before submission. The current working name is related to the web project, but the public mobile listing should use a distinctive name/subtitle if Apple or trademark search shows conflict.
- Use only original launch assets. The current icon is generated specifically for this project, uses an abstract check/progress mark, and avoids copied logos, text, brand marks, people, and third-party imagery.
- Prepare privacy labels: fitness logs are stored on-device, no third-party tracking, no OpenAI API in mobile.
- Build with EAS production profile.
- Install the TestFlight build on a real iPhone and test onboarding, saving, editing, deleting, backup, restore, and reset.
- Test account creation, backup export/restore with account metadata, and reset returning to the account screen.
- Test sign out returning to the account screen while preserving local logs.

## Submission Rule

Only fix release blockers after this point: crashes, broken save/edit/delete flows, confusing copy, layout issues, app identity, and App Store metadata.
