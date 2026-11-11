# Integration boundaries

## Read-only synchronization

CrewCore.FeedSource separates synchronization from transport. PublicGitHubSource reads the existing data branch via HTTPS; it validates the schema and dates, checks HTTP status, and uses finite timeouts. Roster/activity updates commit to one snapshot only after both loads succeed. The app keeps its previous snapshot on network failure; SwiftData persists snapshots and preferences. A version-1 cache envelope rejects future/unsupported versions rather than silently decoding corrupt state. There is no released native store to migrate yet; real SwiftData migration tests must precede the first schema change.

Foreground launch, reactivation, and user refresh synchronize. There is no claim of continuous background monitoring. The public publisher provides daily activity, so the native activity history currently covers the loaded day, not an archive. Empty activity is valid. Stale data warnings use a conservative one-day threshold and distinguish successful fetch time from source generation time.

Shift data is loaded separately and cannot invalidate an otherwise valid roster/activity fetch. The public shift model decodes only date/start/type/label fields used by the existing schedule rule. Cached shifts are used at launch for at most 30 minutes. Native briefing rows are estimates when the known schedule horizon does not cover the date. Widgets and Watch currently calculate from the roster only and explicitly mark briefing estimates. Widget snapshots never contain shift data.

## Authorized operations and private feeds

`AuthorizedOperations` defines instruction submission and approved automation triggering, but has no fake implementation. No management buttons suggest remote writes are possible. Before implementing it obtain an official, authorized Grok bot contract: bot conversation identifiers, action scopes, request idempotency, response/task IDs, status/result schema, authentication/refresh, rate limits, cancellation, and event delivery. A verified per-bot URL may be added as a supported deep link; none was present in the inspected feed. Do not substitute browser automation or ordinary model-chat APIs for bot-management access.

Register a native Firebase iOS client for the existing project, add the appropriate SDK and sign-in flow, and implement a separate FeedSource mapping the existing Firestore wrapper documents. Verify owner rules, denial, token expiry/refresh, revocation, and sign-out cache deletion. Private mode must never silently fall back to the public transport. Keychain helper supports device-only unlocked credentials; no credential is hardcoded or collected in chat.

## Health, tasks, notifications, and Live Activities

Current feeds do not establish operational health. All bots remain Unknown in the UI. HealthEvidence is a tested policy foundation: recent explicit success/heartbeat can establish healthy, explicit failure can establish error, permissions need attention, only an explicit outage establishes Down. Scheduled silence alone cannot establish Down. Per-bot expectations, thresholds, user-configurable checks, and aggregate evidence ingestion remain to implement against the actual backend schema.

Notification settings store opt-in, severity, and local-device quiet hours. The delivery helper deduplicates persisted event IDs and uses generic private content. No notification is generated from message text. There is no configured event producer. Reliable background delivery needs APNs registration, device token lifecycle, an authenticated server event processor, durable idempotency, preferences synchronized to that server, and end-to-end device testing. Local deduplication retention/cleanup must be defined before sustained production ingestion.

WorkflowActivities can start/update/end bounded, server-confirmed tasks. No current screen starts fabricated operations. ActivityKit attributes carry a deadline; terminal events end activities, local timeout ends monitoring without claiming task failure, and launch recovery removes expired activities. iOS suspension means local timers cannot guarantee termination at the exact deadline: authenticated ActivityKit pushes are needed for reliable remote completion and cleanup. Do not use Live Activities for idle bots.

## Head Quarter

HeadquartersReport contains only build version, last successful synchronization, activity-feed generation time, backend failure, and authentication problem. HeadquartersAdapter accepts a provisioned HTTPS endpoint restricted to explicitly approved hosts, reads a bearer token from Keychain, disables redirects, uses an ephemeral session, checks response status, and sends only that report. It is not invoked until endpoint/auth/contract are configured. No private message content or credentials are in the body. Availability, critical error taxonomy, retry/idempotency, token renewal, and the actual Head Quarter API must be agreed and tested before activating transport.

## Apple configuration

Use matching registered app/extension/Watch bundle IDs, App Group entitlements, and development team. Configure device signing and production artwork. Exercise WidgetKit refresh budgets, locked-device privacy, Siri permissions/phrases, and custom URL routing on devices. Live Activities require supported iPhone hardware/system settings. APNs requires an Apple Developer capability and backend provider setup; it is deliberately not claimed as working.

Watch is a small public-feed companion with its own offline file cache and favourite selection, upcoming routines, unknown health, privacy-sensitive views, and foreground refresh. It has no verified alerts/actions, WatchConnectivity preference sync, complications, or Smart Stack widget yet. It does not pretend to acknowledge server alerts.
