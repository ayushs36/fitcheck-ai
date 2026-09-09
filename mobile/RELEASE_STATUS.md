# FitCheck AI Mobile Release Status

## Current Status

- Release version: `1.0.0`
- iOS bundle ID: `com.ayushs36.fitcheckai`
- EAS CLI: reachable through the local `npx eas-cli` scripts
- Expo account on this Mac: `ayushs36`
- EAS project: `@ayushs36/fitcheck-ai-mobile`
- EAS project ID: `52e56b43-3cc7-4099-81d2-8635b55fcacd`
- EAS project URL: `https://expo.dev/accounts/ayushs36/projects/fitcheck-ai-mobile`
- Version source: remote EAS auto-incrementing
- Release preflight: passing
- Expo Doctor: `21/21` checks passing
- Mobile OpenAI usage: not included in the public client
- Current blocker: Apple Developer Program enrollment is still pending, so the first iOS signing/TestFlight build should wait until Apple activates the account.

## Next Required Manual Step

After Apple Developer enrollment is approved, start the TestFlight build from the mobile app folder:

```bash
cd /Users/ayushs36/fitcheck-ai/mobile
npx eas-cli whoami
npm run preflight:release
npm run build:ios:testflight
```

After the build completes, submit it:

```bash
npm run submit:ios:testflight
```

## Day 37 Result

Day 37 confirmed the app is release-preflight clean, logged this Mac into Expo, linked the local app to the EAS project, and configured remote build numbering. The remaining blocker is Apple Developer Program approval before completing iOS credentials and TestFlight submission.

## Day 38 Result

Day 38 is the mobile release-freeze pass: the app configuration, App Store checklist, TestFlight guide, privacy guardrails, and release status are aligned around the same source of truth. No new product features were added, because the app should stay stable until the first TestFlight build is available.
