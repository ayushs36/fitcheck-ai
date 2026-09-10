# FitCheck Coach Release Status

## Current Status

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

## Next Required Step

Install the available build using the existing TestFlight invitation:

- Build `1.0.0` / `5` is confirmed in App Store Connect.
- Install the build on a real iPhone through TestFlight.
- Run the first TestFlight QA checklist in `TESTFLIGHT_BUILD_GUIDE.md`.
- Capture App Store screenshots with fictional data only.
- Verify the updated public support page after deployment.
- Implement and test cloud accounts and backup in a separate mobile backend without overwriting existing logs. Update privacy disclosures, listing copy, and reviewer instructions to match the new implementation before submitting a new build.
- Resolve any regional compliance prompts, then submit the tested build for App Review.

## Day 37 Result

Day 37 confirmed the app is release-preflight clean, logged this Mac into Expo, linked the local app to the EAS project, and configured remote build numbering. The remaining blocker is Apple Developer Program approval before completing iOS credentials and TestFlight submission.

## Day 38 Result

Day 38 is the mobile release-freeze pass: the app configuration, App Store checklist, TestFlight guide, privacy guardrails, and release status are aligned around the same source of truth. No new product features were added, because the app should stay stable until the first TestFlight build is available.

## V1 Release State

The mobile app is feature-frozen for v1. The first FitCheck Coach iOS production build was successfully uploaded to App Store Connect. Remaining work is TestFlight QA, fictional-data screenshots, App Store listing entry, and App Review submission.
