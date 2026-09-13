# FitCheck Coach Cloud Foundation

Status: initial schema applied through the SQL editor to the separate mobile
project `uzjrzjfduzqhfvypmlra` on September 10, 2026. The mobile app still
defaults to local storage. A gated cloud startup path is implemented but is not
enabled in the production profile or installed TestFlight build 5. No personal logs have been
uploaded, migrated, or reset during development.

The separate `cloud-qa` EAS profile enables cloud mode for internal TestFlight
validation and contains only the project URL and public publishable key. Build 6
was created as `22a2cdd6-cadb-45d9-b644-244b53ce3460`; signing was refreshed with
the existing distribution certificate. EAS submission
`3e4129e5-6ebf-4dbb-838b-50b24bd4d327` finished successfully. Tester availability
and device QA remain unverified. Do not submit it to App Review before device QA.
Export build 5's local records before installing an update or approving migration.

September 12 deployment: both payload-limit and deletion-limiter migrations were
applied through Management API SQL, and `delete-account` was deployed with gateway
JWT verification enabled. Read-only checks confirmed both tables have RLS,
the payload constraint is validated, clients cannot execute the limiter or hard
delete records, and the mobile record count remains zero. An unauthenticated
function POST returns 401. This does not verify an authenticated Apple deletion.
Management API SQL also does not update the migration ledger; reconcile all three
migration entries before future CLI database pushes.

Live read-only verification confirmed RLS enabled, three access policies,
anonymous SELECT denied, authenticated hard DELETE denied, and zero records.
The migration has passed local PostgreSQL behavioral tests using PGlite with a
minimal Supabase auth contract. Hosted JWT and end-to-end tests remain pending.
The hosted pgTAP suite has not yet run. Applying SQL through the editor
does not register this file in the CLI migration ledger; reconcile that ledger
before using a CLI database push. Do not rerun the initial migration blindly.

Use a separate Supabase project for mobile, never the FitCheck AI web app.
Apply migrations only after confirming the destination project. Run the SQL
test suite against a disposable Supabase database with pgTAP before release.

## Storage Contract

- Authenticated users can read/write only their own records through RLS.
- Daily log keys are calendar dates; workout keys are existing session IDs;
  settings use the `singleton` key.
- Payloads preserve omitted fields. Missing nutrition or steps are not zero.
- Updates send the last downloaded revision. Conflicting writes fail instead
  of silently overwriting a newer edit. Do not automatically retry with a new revision.
- Deletions use tombstones (`deleted = true`), not physical client deletes.
- Deleting an auth user cascades their records. Account deletion still needs a
  server endpoint that authenticates the caller; never ship a service-role key.

## Remaining Integration

The account-scoped migration helper in `src/storage/accountStorage.ts` is wired
into the disabled cloud startup path. `npm run test:storage` (Node 22.18+ or 24+) tests backup
verification, interrupted imports, concurrent imports, consent, and refusing to
overwrite existing account data. UUID syntax validation is not authentication:
the caller must derive the ID from a verified session. Record validation checks
dates, goal values, nested workout sets, numeric values, and duplicate identities.
Imports share a lock per storage adapter. Use the same adapter object throughout
the app. A persistent ownership claim prevents legacy device logs from being
attached to another account, including after an interrupted destination write.

## Implemented Foundations

- Native Sign in with Apple flow with random state, SHA-256 nonce, cancellation
  handling, and Supabase token exchange. Supabase Apple provider is enabled for
  `com.ayushs36.fitcheckai`. Apple Developer capability was saved and verified on
  September 11, 2026, as a primary App ID named FitCheck Coach. The next build
  requires a refreshed provisioning profile.
- Lazy native client using Expo SecureStore, restricted to the mobile project
  URL and publishable keys. No credentials have been added to the repository.
- Persistent per-account upload queue, version-aware acknowledgements, and
  explicit upload conflicts. Retains edits made during an in-flight upload.
- `workspace.ts` commits cached records, pending edits, and conflicts in a single
  account-specific storage document. Pending payloads are the visible local
  version; there is no separate log write that can get ahead of its upload queue.
  Shared adapter locks serialize concurrent writes, and corrupt storage fails
  closed. Use this workspace for app integration, not the standalone outbox.
- Verified migration backups can initialize a previously absent workspace in
  one write. Backups and legacy keys are retained. Existing workspaces require
  an explicit merge and cannot be replaced by this import path.
- `sync.ts` connects downloads, workspace reconciliation, and version-checked
  uploads. It coalesces concurrent sync requests, stops after disposal, and
  preserves failed uploads for retry. Dispose it before account switching.
- `accountData.ts` provides typed daily-log, workout, and goal-setting access
  over that workspace, preserving omitted metrics and bodyweight/form flags.
  Closing it rejects future reads and queued writes from the old session.
- All seven app screens now use `StorageProvider` instead of importing storage
  functions directly. Its default remains the original local-only adapter.
  The authenticated root must supply a complete account adapter and key/remount
  the provider per session; do not use a mutable global current-account pointer.
- `session.ts` verifies Supabase identity before opening storage, binds account
  data and sync together, and invalidates the session on sign-out/account change.
  It exposes closure notifications for the root UI. Opening a session does not
  automatically import or upload any records.
- `CloudRoot` and `CloudWorkspace` now wire Apple sign-in, import consent,
  account storage, sync, and the existing logging screens behind
  `EXPO_PUBLIC_ACCOUNT_SYNC_ENABLED=true`. The normal app remains local-only.
  Initial restore errors block onboarding rather than showing an empty account.
- Cloud account settings provide sync status, backup export, sign-out, and
  readable conflict review. Legacy bulk replacement/reset methods are explicitly
  unavailable for cloud accounts; they never fall back to device storage.
- Daily-log and workout edits compare their original draft record against the
  current workspace before saving. Stale drafts are retained and rejected rather
  than overwriting newly downloaded records.
- Conflicts retain both versions and require an explicit local/remote choice.
  A successful upload with a lost response conservatively requires review on
  the next pass rather than guessing whether it is safe to discard a local edit.
- Download reconciliation preserves pending edits and deletion tombstones,
  refuses foreign-account records, and does not treat missing pages as deletion.
- Account-verified downloads use 100-record keyset pages per record type,
  retain tombstones, and reject malformed pages or account changes mid-request.
  Each new sync pass must start at the beginning to catch edits behind a cursor;
  multiple pages are not a transactionally consistent server snapshot.
- `npm run test:cloud` covers migration, authentication, queues, reconciliation,
  validation, and local database behavior.
- Mobile TypeScript, Expo Doctor (21 checks), and root web build pass.

The cloud release flag is not enabled. No cloud sync or login is active in build
5. The single-document workspace and coordinator
pass simulated two-device tests, but real AsyncStorage interruption behavior,
hosted authentication, and iPhone recovery still need end-to-end verification.
Current test suite: 145 passing tests. No real personal records were used.
The latest sign-out cleanup fix was made after build 6 and needs a new binary.

Offline reopening is connected only in the disabled cloud path. `offlineAccess.ts` defines a seven-day
local-cache permission bound to the last online-verified account and matching
cached session. It rejects auth failures, mismatched accounts, expired grants,
clock rollback, and corrupt grants. `offlineAccessNative.ts` supplies device-only
SecureStore storage. Startup/session integration requires an existing workspace
and a matching cached Supabase session; sync re-verifies identity before upload.
Manual sign-out and deletion revoke the grant. Real offline-device tests remain,
especially expired cached sessions: refresh failures can still prevent reopening.
The seven-day grant does not guarantee seven days of offline availability.

## Account Deletion Setup

The server-only deletion handler validates the authenticated account, requires
explicit confirmation and fresh Apple authorization, matches the verified Apple
subject, and revokes Apple authorization before deleting the account. Its Apple
service signs short-lived client secrets and verifies returned identity tokens.
Tests use fictional identities and generated test keys, not production secrets.
Run `npm run typecheck:server` separately from the mobile TypeScript check.

The endpoint is deployed but not enabled in a mobile build. The Supabase authentication/admin
adapter and Edge Function entry point are implemented. The adapter derives the
Apple subject only from server-returned identities, not editable user metadata,
and binds deletion authorization to one request. Dependencies are pinned in the
function's `deno.json`. The Node TypeScript check covers the server modules but
not the Deno entry point. The complete entry point passed `deno check` using
Deno 2.9.6 on September 12, 2026. Hosted execution and integration with the real
Apple/Supabase services remain unverified.

The four Apple secrets were verified by digest on September 12. The private-key
digest initially differed from the downloaded key, so that secret was replaced
from the approved file using a private temporary file that was removed afterward.
The resulting digest matches. No secret contents were printed or committed.
The function also requires Supabase's server-provided `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`; do not copy those values into mobile configuration.
Native device verification, authenticated hosted limiter testing, and end-to-end tests remain
outstanding. The replacement Apple key was saved in the owner's Downloads folder.
The mobile `accountDeletionFlow.ts` orchestration and native Apple/Supabase
adapters are connected to the disabled cloud Account screen. It requires explicit confirmation,
verifies the same account before and after Apple's prompt, checks returned state,
and accepts only explicit server success. Cancellation and uncertain responses
never clear records. The native adapter shares Apple's sign-in lock, does not
create a Supabase session, and sends an explicitly verified access token to the
deletion function. Adapter tests cover account switches, token changes, and
service failures; native Apple prompts still require device testing.
Workspace cleanup is implemented as a serialized, persistent account-deleted
marker after a matching confirmed deletion receipt. The marker replaces active
records, pending writes, and conflicts, and prevents delayed writers or a later
workspace instance from recreating the deleted workspace. It retains original
device logs, import snapshots/backups, and other accounts. Tests cover isolation,
late writes, and failed cleanup persistence. The account session invokes cleanup
only after explicit remote deletion success, then clears the matching local auth
session. Cancellation and remote failures retain the workspace. Cleanup failures
report that cloud deletion already happened, rather than suggesting a repeat
cloud deletion. The UI warns that original logs and backups remain. Device
verification remains a release gate. A persisted cleanup journal now records
confirmed deleted account IDs before cache retirement, and startup/sign-in retry
pending cleanup before opening account data. It retains the receipt if cache
writes or sign-out fail. Tests cover restart recovery, corrupt journals, and
concurrent helpers. If even the initial receipt cannot be persisted, automatic
recovery is not guaranteed; manual recovery and real-device fault testing remain.
The native deletion flow now verifies journal writability before Apple's prompt
or any destructive request, and refuses new deletion while cleanup is pending.
This prevents deletion when storage is already broken, but cannot guarantee a
later write succeeds if storage fails during the network request.
Never put its contents in this repository, mobile configuration, or build output.

The applied `202609120002_deletion_attempt_limit.sql` migration adds a
server-only, atomic deletion-attempt counter: five attempts per account in a
15-minute window. The handler claims an attempt after validating identity/body
and before exchanging Apple tokens. Exhaustion returns 429; limiter failures
return 503 without revocation/deletion. Local PostgreSQL tests verify access
restrictions, account isolation, expiry, and cleanup by account-deletion cascade.
This is not an IP-level or general API abuse limit. Hosted grants are verified;
real authenticated behavior still requires disposable-account testing.
Missing RPC configuration fails closed.

## Release Gates

1. Refresh signing, configure the publishable key in EAS, and test the gated
   native button and session lifecycle. Verify secure
   storage with real session sizes and interrupted token refresh on an iPhone.
2. Verify account-scoped storage and session switching on real devices. Test the
   bounded offline startup path, expired-session refresh, and permission revocation
   before promising reliable offline access after restart.
3. Export a pre-migration backup and obtain explicit consent to attach local
   logs to a verified account. Never identify ownership by an unverified email.
4. Validate screen-level loading/error states, retry scheduling, and conflict
   review on an iPhone. Goal-setting edits and deletion confirmations now include
   stale-record guards; verify those screens on-device. Initialize/import before the first download,
   and never start a second sync coordinator for the same active account session.
5. Validate payloads before upload and restore; reject malformed data without
   replacing local records. The applied `202609120001_mobile_payload_limit.sql`
   migration caps each serialized JSONB payload at 65,536 bytes. Local PostgreSQL
   tests cover oversized inserts/updates and multibyte text, including preserving
   the original payload/revision on rejection. The live constraint is validated;
   add friendly client-side size feedback before release.
6. Test hosted access controls, cross-device recovery, tombstones, migration
   interruption, sign-out, and account deletion (including Apple token revocation).
7. Update privacy disclosures and submit a new tested binary before cloud launch.

Do not enable the cloud flag in production until account deletion, Apple token
revocation, privacy updates, and device QA are complete. The native iOS JavaScript
bundle exports successfully; a browser preview requires the optional
`react-native-web` dependency, which has not been added solely for previewing.

Only the project URL and publishable key belong in mobile configuration. Database
passwords, service-role keys, and OpenAI keys must never enter the app bundle.

Email login was deferred by the owner in favor of native Apple sign-in. Custom
SMTP remains disabled; do not expose email-code login in the launch app.

Dependency audit reports 11 moderate findings in the Expo build-tool chain via
`xcode`/`uuid`. No high or critical findings were reported. The suggested automatic
fix downgrades Expo to SDK 46 and was not applied. Review compatible upstream fixes
before release rather than using `npm audit fix --force`.
