# FitCheck Coach Release Status

## Current Status

September 13, 2026:

- Private web-log import is implemented in source, not in build 8. The personal
  web History view exports a dedicated JSON file; cloud Account > Backup imports
  it only after file preview and signed-in-account confirmation. Existing dates,
  including workouts and tombstones, are skipped. Goal settings and original web
  logs remain unchanged; historical goals without a saved phase are disclosed.
  Imports verify a recovery snapshot before committing the account workspace.
  No personal files were accessed or transferred during implementation.
- The owner explicitly approved uploading the updated source to the existing
  Expo/EAS project. Importer build `9` was created as
  `7d0580e7-0194-4900-90c4-a8c9ba3818f2`, with TestFlight upload queued as
  `944c7eff-0af8-453d-a1c0-f0a59314fcb6`. Compilation and Apple processing are
  not yet confirmed complete. Web deployment and device testing are still needed
  before personal use. Do not submit build 8 as containing this feature.
- Replacement candidate: build `8`, EAS ID
  `b056b538-b0f0-4d2e-84e2-b633d32969bc`, created at the owner's request after
  the cancellation of build 7. Submission
  `b921746f-2ab5-470c-8cdc-989e58039c7d` reached Apple. Apple's API confirms
  processing VALID, internal state IN_BETA_TESTING, and not expired. Build 8 is
  available for internal TestFlight testing; device QA remains outstanding.
- Cloud QA build: `6`, EAS ID `22a2cdd6-cadb-45d9-b644-244b53ce3460`.
- TestFlight upload scheduled: `3e4129e5-6ebf-4dbb-838b-50b24bd4d327`;
  EAS reports finished on September 12 at 22:51 UTC. Apple's API subsequently
  confirmed processing VALID and internal state IN_BETA_TESTING.
- Production profile remains local-only; `cloud-qa` enables Apple login and sync.
- Mobile Supabase migrations and deletion function are deployed. Secret digests,
  RLS/grants, and unauthenticated rejection were checked; authenticated Apple
  end-to-end behavior still needs disposable-account/device testing.
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

On September 13 the owner confirmed these build-6 tests succeeded with fictional
data: Apple sign-in, saving a log, closing/reopening, airplane-mode reopening and
editing, syncing after reconnecting, and signing out/back in with the same account.
These are user-reported passes, not assistant-observed device tests. Separate-device
restoration, cross-account isolation on devices, expired-session offline reopening,
and Apple-authenticated account deletion remain unverified. Do not infer those
results from same-device persistence or mark the full release checklist complete.

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
- Mobile OpenAI usage: not included in the public client
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

- Complete the unverified cloud/device tests listed above using disposable accounts
  and fictional records, especially account deletion and independent restoration.
- Resolve any release-blocking failures and test replacement build 8 once Apple
  finishes processing it. Build 7 remains canceled. Do not describe build 8 as
  device-tested based on the earlier build-6 results.
- Update Apple's privacy questionnaire for account-linked cloud data. Obtain owner
  approval of the updated declaration before publishing; the previous approval
  covered only the local-only disclosure.
- Supply fictional-data screenshots for the required iPhone and iPad sizes.
  Cloud listing copy and reviewer instructions have been synced.
- Verify the tested cloud build is selected on the version submission page;
  the historical build-5 selection is not confirmation of a build-6 selection.
- Resolve any regional compliance prompts, submit the tested release for App
  Review, and address Apple's feedback. Approval timing is controlled by Apple.

## Day 37 Result

Day 37 confirmed the app is release-preflight clean, logged this Mac into Expo, linked the local app to the EAS project, and configured remote build numbering. The remaining blocker is Apple Developer Program approval before completing iOS credentials and TestFlight submission.

## Day 38 Result

Day 38 is the mobile release-freeze pass: the app configuration, App Store checklist, TestFlight guide, privacy guardrails, and release status are aligned around the same source of truth. No new product features were added, because the app should stay stable until the first TestFlight build is available.

## V1 Release State

The mobile app is feature-frozen for v1. The first FitCheck Coach iOS production build was successfully uploaded to App Store Connect. Remaining work is TestFlight QA, fictional-data screenshots, App Store listing entry, and App Review submission.
