# FitCheck Coach Release Status

September 20 release candidate: version 1.0.0, build 14

- Source revision: `4c38088`; Expo patched to 57.0.24.
- Release preflight: 21/21 checks; 161 automated tests passed.
- EAS build: `ced8b6e4-f813-45ea-b3e9-e6f42c90e77d` (cloud-qa,
  Apple sign-in and cloud sync enabled, existing signing credentials reused).
- Automatic TestFlight submission scheduled:
  `b7634d5e-ec2e-4024-94e9-85900536eb17`.
- Build completion, upload, and Apple processing still require confirmation.
  This is not an App Store review submission.

Included changes:

- Removed the temporary web-to-mobile transfer controls and implementation.
  Previously imported records retain their identifiers and storage format.
- Today uses the phone's local calendar date and refreshes at midnight or on
  returning to the app. Saved logs remain editable for the same day.
- The editor distinguishes saved records from unsaved edits and restores local
  drafts when reopening.
- Verify retained logs, local date rollover, saved/unsaved status, and sync on
  the iPhone after installing build 14.

## Current Status

September 19 build 10:

- Source revision `a9818fc` includes setup import, navigation/UI cleanup, trend
  parity, sorted input handling, zero/blank metric exclusion, and same-workout-type
  volume comparisons. TypeScript, 167 automated tests, and the web build passed.
- EAS build: `e9374f20-f114-4627-b706-15830f521c35`, version 1.0.0 (10), cloud-qa.
  Existing signing credentials were reused. TestFlight upload is scheduled as
  `04f1092e-4ea8-4bb2-a525-4923c452b225`; scheduling is not proof of Apple processing
  completion. No App Store review submission was made.
- Test notes could not be supplied through EAS (Enterprise-only feature); upload
  was scheduled successfully without them. Check onboarding import with fictional
  data, retained logs after updating, selection menus, Progress views and sync.
- Browser control still crashes before page access. Privacy publication and
  screenshot upload remain blocked. Genuine device screenshots and build-10 phone
  verification are outstanding. This review does not claim complete parity for
  simplified mobile nutrition scoring, goal forecasts, or long-term strength rules.

September 19, 2026 source update (requires a new TestFlight build):

- UI follow-up: daily logging comes first; coaching detail, notes, and previous
  workout detail are expandable. Progress separates Overview, Charts, and History.
  Screen width is constrained on tablets, surfaces use a consistent quieter style,
  and bottom navigation exposes Account with selected-tab accessibility state.
  No data schema, API access, or account permissions changed in this UI pass.
  Visual phone verification remains required; this Mac has no available simctl.

- Cloud onboarding now offers the existing confirmed web-log import before setup.
  Saved account history prefills the latest logged goal and earliest valid weight;
  targets absent from the export remain optional. Unit changes convert weights.
- Mobile trend pace now compares the latest seven valid weigh-ins against the
  preceding seven, matching the web formula. Blank weights are skipped, and fewer
  than fourteen weigh-ins do not produce a pace. These are log windows, not fixed
  calendar weeks when weigh-ins are missing.
- Workout type and saved-exercise choices use compact menus; custom exercise entry
  remains available. Import access is account-scoped, not restricted to the owner.
- Mobile TypeScript, all 165 automated tests, and the web production build passed.
  New native UI requires phone verification; build 9 does not include this update.
  No personal logs were read, uploaded, cleared, or changed during this work.

September 17, 2026:

- Private web-log import is implemented in source, not in build 8. The personal
  web History view exports a dedicated JSON file; cloud Account > Backup imports
  it only after file preview and signed-in-account confirmation. Existing dates,
  including workouts and tombstones, are skipped. Goal settings and original web
  logs remain unchanged; historical goals without a saved phase are disclosed.
  Imports verify a recovery snapshot before committing the account workspace.
  No personal files were accessed or transferred during implementation.
- The owner explicitly approved uploading the updated source to the existing
  Expo/EAS project. Importer build `9` was created as
  `7d0580e7-0194-4900-90c4-a8c9ba3818f2`, with TestFlight submission
  `944c7eff-0af8-453d-a1c0-f0a59314fcb6`. Apple's API confirms processing VALID,
  internal state IN_BETA_TESTING, and not expired. GitHub main is confirmed at
  `38ac5bfdc45c6b7f3fcfd5d3e0417c1ef5665f30`. Vercel's production deployment
  `dpl_2PFnoYEuxbhx9QBtZCTF4qUPbrSF` is READY at that same commit, confirming
  deployment of the web export. The owner confirmed the build-9 fictional-data
  device checklist passed on September 17. Do not submit build 8 as containing
  this feature.
- Replacement candidate: build `8`, EAS ID
  `b056b538-b0f0-4d2e-84e2-b633d32969bc`, created at the owner's request after
  the cancellation of build 7. Submission
  `b921746f-2ab5-470c-8cdc-989e58039c7d` reached Apple. Apple's API confirms
  processing VALID, internal state IN_BETA_TESTING, and not expired. Build 8 is
  available for internal TestFlight testing; build 9 supersedes this candidate.
- Cloud QA build: `6`, EAS ID `22a2cdd6-cadb-45d9-b644-244b53ce3460`.
- TestFlight upload scheduled: `3e4129e5-6ebf-4dbb-838b-50b24bd4d327`;
  EAS reports finished on September 12 at 22:51 UTC. Apple's API subsequently
  confirmed processing VALID and internal state IN_BETA_TESTING.
- Production profile remains local-only; `cloud-qa` enables Apple login and sync.
- Mobile Supabase migrations and deletion function are deployed. Secret digests,
  RLS/grants, and unauthenticated rejection were checked. The owner subsequently
  reported successful build-9 cloud and account-deletion device testing.
- Local checks: 163 tests pass, including web-export/mobile-import round trips and
  account-isolation safeguards. Mobile TypeScript, all 21 Expo Doctor checks, and
  an iOS export with the new importer pass. Server TypeScript passed before this
  mobile-only change; no server code was changed.
- Post-build-6 change: sign-out now attempts Supabase cleanup even when offline
  permission cleanup fails. Build 8 includes this fix; build 6 does not.
- Updated public privacy policy is verified live. The cloud listing description,
  name, categories, existing age-rating answers, and automatic-release settings
  were synced with owner approval. Reviewer instructions and approved private
  contact details were also synced successfully. App Store privacy disclosures
  still need updating.
- Export installed build 5's logs before updating. Do not import personal logs
  during initial cloud QA. No personal data was migrated during development.
- No App Review submission has been made for the cloud build.
- Automated startup tests confirm failed offline token refresh and rejected or
  mismatched credentials deny access without modifying saved logs. They do not
  establish that expired sessions can reopen offline on a real device.
- Browser automation currently fails before connecting to App Store Connect.
  The initial full metadata publication was blocked by safety review; the owner
  subsequently approved its release/age-rating scope and the sync succeeded.
  Reviewer notes validate through the `store-review` profile, which reads private
  contacts from environment variables. The owner explicitly approved the contact
  name, and Apple confirmed the review-details update. Phone details are not
  stored in the repository.

## User-Reported Device QA

On September 17 the owner confirmed the build-9 fictional-data checklist was
complete: import, duplicate prevention, cross-device sync, account isolation,
offline reopening, and account deletion. Record these as user-reported passes,
not assistant-observed tests. No additional device logs or screenshots were
provided. This report does not establish separate fault-injection or deliberately
expired-token test results. Move on to privacy disclosure, screenshots, build
selection and App Review submission; do not repeatedly request the completed
checklist.

Earlier build-6 report:

On September 13 the owner confirmed these build-6 tests succeeded with fictional
data: Apple sign-in, saving a log, closing/reopening, airplane-mode reopening and
editing, syncing after reconnecting, and signing out/back in with the same account.
These were user-reported passes, not assistant-observed device tests. At that
time, separate-device restoration, cross-account isolation and Apple-authenticated
deletion were unverified; the later build-9 report above supersedes those gaps.

## Historical Build 5 Snapshot

The following was recorded before cloud development and is not the current cloud
release checklist. In particular, its no-login/Data Not Collected statements
apply only to build 5.

- Release version: `1.0.0`
- iOS bundle ID: `com.ayushs36.fitcheckai`
- EAS CLI: reachable through the local `npx eas-cli` scripts
- Expo account on this Mac: `ayushs36`
- EAS project: `@ayushs36/fitcheck-ai-mobile`
- EAS project ID: `52e56b43-3cc7-4099-81d2-8635b55fcacd`
- EAS project URL: `https://expo.dev/accounts/ayushs36/projects/fitcheck-ai-mobile`
- Final app name: `FitCheck Coach`
- Version source: remote EAS auto-incrementing
- Release preflight: passing
- Expo Doctor: `21/21` checks passing
- Apple Developer Program: verified
- App Store Connect app ID: `6810485632`
- Latest iOS build ID: `d008b19d-cf55-4739-8cfe-dbdba710c1d5`
- Latest iOS build number: `5`
- Latest iOS artifact: `https://expo.dev/artifacts/eas/RhRS647NUfj2IhUMUU4xfa-NnxKFjNBp2AvfTI0i4o0.ipa`
- Latest submission ID: `998318f4-860f-449f-93a0-37e668a8d885`
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6810485632/testflight/ios`
- App Store listing URL: `https://appstoreconnect.apple.com/apps/6810485632/appstore`
- App Store metadata: synced with final app name `FitCheck Coach`
- Apple processing: completed; build `1.0.0` / `5` was available in TestFlight on September 10, 2026.
- Internal testing: Team (Expo) has one invited tester; no installs or test sessions were recorded when checked.
- Listing: description, promotional text, keywords, support URL, copyright, subtitle, and Health & Fitness category saved in App Store Connect.
- Age rating: Health or Wellness Topics declared; Apple calculated 9+ with regional and older-OS exceptions.
- App Privacy: Data Not Collected published with owner approval on September 10, 2026.
- Content rights: no third-party content declared and saved.
- Regulated medical device: declared not a regulated medical device.
- Release build: build `5` attached and saved on the version `1.0` submission page.
- Pricing: free ($0.00), explicitly approved by the owner and configured in App Store Connect.
- Availability: worldwide launch approved by the owner; App Store Connect shows 175 Available. Regional regulatory requirements still apply.
- Submission validation: after private review contacts were saved, Apple's remaining errors were 6.5-inch iPhone screenshots and 13-inch iPad screenshots.
- Review contact: approved contact information and no-login-required review instructions saved privately in App Store Connect.
- Public support: approved support email added to the support page; deployment must be verified after push.
- Native QA: not performed in this session; no accessible iPhone or configured `simctl` is available on this Mac.
- Store configuration validation: EAS Metadata lint passed.
- Current blockers: real-iPhone testing and screenshots. The app has not been submitted for App Review. Cloud accounts and backup are planned for the next work session before public launch; no cloud implementation or data migration has occurred.

## Remaining Release Steps

- Build 9 is the user-tested candidate. Build 7 remains canceled; do not create
  another binary unless a release-blocking issue requires a code change.
- Update Apple's privacy questionnaire for account-linked cloud data. Obtain owner
  approval of the updated declaration before publishing; the previous approval
  covered only the local-only disclosure.
- Supply fictional-data screenshots for the required iPhone and iPad sizes.
  Cloud listing copy and reviewer instructions have been synced.
- Select and verify build 9 on the version submission page; the historical
  build-5 selection is not confirmation of the current selection.
- Resolve any regional compliance prompts, submit the tested release for App
  Review, and address Apple's feedback. Approval timing is controlled by Apple.

## Day 37 Result

Day 37 confirmed the app is release-preflight clean, logged this Mac into Expo, linked the local app to the EAS project, and configured remote build numbering. The remaining blocker is Apple Developer Program approval before completing iOS credentials and TestFlight submission.

## Day 38 Result

Day 38 is the mobile release-freeze pass: the app configuration, App Store checklist, TestFlight guide, privacy guardrails, and release status are aligned around the same source of truth. No new product features were added, because the app should stay stable until the first TestFlight build is available.

## V1 Release State

The mobile app is feature-frozen for v1. Build 9 is available in TestFlight and the
owner reports its fictional-data checklist passed. Remaining work is privacy
disclosures, fictional-data screenshots, final build selection, and App Review
submission. Listing copy and reviewer instructions have already been synced.
