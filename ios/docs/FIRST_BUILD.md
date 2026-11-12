# First Apple build and simulator validation

Prepared 2026-11-12 on `feature/native-crew-ios`. The complete original native implementation was verified as committed in `c737ef1`, and the branch was successfully pushed to the existing crew-map repository. No merge, main update, deployment, publisher invocation, or production-data write was performed.

## Build failures found and corrected

The [first Apple CI run](https://github.com/jacksonpjwilson-dev/crew-map/actions/runs/43205964880) generated the Xcode project and passed CrewCore tests, but failed the iOS build with seven availability diagnostics in CrewIntents.swift: `OpenURLIntent is only available in iOS 18.0 or newer`. Crew's deployment target remains iOS 17.

Commit `19f714f` replaces OpenURLIntent with an iOS 17-compatible pending-route handoff consumed on launch, activation, and intent notification; `openAppWhenRun` still foregrounds the app. Runtime Siri/Shortcuts invocation requires separate testing. The build command's global `-sdk iphonesimulator` override was also removed because its logs showed the Watch target compiling against the iPhone SDK. Target SDKs now resolve from their platform and destination, with an explicit additional watchOS Simulator build.

The workflow now includes an iPhone UI test, concurrency/timeout limits, and `.xcresult` upload. The modern Watch companion is a single watchOS application target, rather than a legacy separate WatchKit app/extension pair. All app/extension/test targets are declared in project.yml and generated with XcodeGen.

## Current validation

[Build and runtime validation run](https://github.com/jacksonpjwilson-dev/crew-map/actions/runs/43290018951), source commit `19f714f`:

| Check | Result |
|---|---|
| CrewCore on macOS | Passed: nine deterministic tests; optional live-network test skipped |
| XcodeGen project generation | Passed |
| iPhone Simulator build including embedded targets | Passed |
| Separate Watch Simulator build | Passed |
| iPhone launch, native-tab navigation, SwiftData relaunch | Passed: one UI test, zero failures; 37.073 seconds |
| Existing web smoke tests | 72 local checks passed; original web CI remains separate |

The initial implementation had also passed all ten shared tests, including the opt-in live GitHub/activity/shift feed test, on Linux. That does not substitute for Apple UI runtime tests.

The run completed successfully on an Apple Silicon macOS runner using Xcode 16.4 (16F6), Swift 6.1.2, and an iPhone 16 Pro simulator running iOS 18.5. Cold simulator/test-runner startup accounted for most of the approximately 12-minute job; the actual UI test took about 37 seconds. No cancellation or retry was needed. The UI test verifies native launch, all five tab destinations, and successful relaunch after the initial SwiftData store is created; it does not assert remote data freshness or detailed offline persistence.

The [.xcresult artifact](https://github.com/jacksonpjwilson-dev/crew-map/actions/runs/43290018951/artifacts/13976534445) contains the test result and first-launch screenshot. Download it from the run's Artifacts section and open the extracted result bundle with Xcode. Artifacts are subject to GitHub retention/access rules.

Remaining diagnostics: Xcode's AppIntents SSU training tool emitted a nonfatal `Unable to parse extract.actionsdata` diagnostic, then continued phrase training; the build and UI test both succeeded. Siri/Shortcuts discovery and execution have not been runtime-tested, and this diagnostic remains to investigate in that feature's validation. There were also GitHub action Node-version deprecation notices. No Swift compilation failure remains in this validated run. iOS 17 runtime and physical-device validation are still pending; the deployment target is 17 and compiler availability checking passed against that target.

A subsequent documentation-only commit records these results and setup instructions; it does not change the validated Swift sources, project specification, fixtures, tests, or workflow. CI is intentionally skipped for that documentation-only commit.

## What these results establish

Successful builds establish that the app, native intents, SwiftData declarations, WidgetKit/ActivityKit UI, and Watch source compile for their simulator SDKs. They do not establish device provisioning, App Group sharing or widget refresh, actual Siri invocation, production Keychain credentials, push notification delivery, Live Activity remote updates, Watch app interaction, or private Firebase authorization. None of those is claimed as operational.

Use the [MacBook setup instructions](../README.md) for exact clone/update/generate/run commands and manual Apple settings. The public read-only slice needs no Grok, Firebase, Head Quarter, or APNs credential. Keep production credentials out of the repository.
