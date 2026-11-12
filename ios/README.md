# Crew: first native build on a MacBook Air M2

The app targets iOS 17+, with a watchOS 10+ companion. The first corrected macOS CI run passed iPhone/Watch simulator builds and the iPhone launch/navigation/relaunch test on Xcode 16.4 with iOS 18.5; see [the recorded results](docs/FIRST_BUILD.md). XcodeGen creates the project from the committed `project.yml`; the generated `.xcodeproj` is intentionally ignored. The local CrewCore package, app, WidgetKit/Live Activity extension, Watch application, tests, and documentation are all in this repository.

## 1. Install the Apple tools once

1. Install **Xcode 16.4 or later** from the Mac App Store (a compatible macOS version is required). The first CI build used Xcode 16.4. Use the full Xcode application, not only Command Line Tools.
2. Open Xcode once, accept the license, and let additional components finish installing.
3. In **Xcode → Settings → Components** (called Platforms in some versions), install an iOS simulator runtime. Enable/download watchOS platform support too, because Crew embeds the Watch companion. A Watch runtime is needed to run the companion; an iPhone runtime is enough for the iPhone UI tests once the Watch SDK is installed.
4. If Homebrew is not installed, use the instructions at https://brew.sh. In Terminal:

```sh
brew install xcodegen
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version
swift --version
```

Adjust the Xcode path if your application has a versioned name. The sudo command selects your installed Xcode locally; it does not change the repository.

## 2. Clone or update the native branch

For a fresh checkout:

```sh
git clone --branch feature/native-crew-ios --single-branch \
  https://github.com/jacksonpjwilson-dev/crew-map.git
cd crew-map
```

If you already have this repository, start in its directory. Save/commit any local changes before switching branches; these commands do not discard them:

```sh
git status
git fetch origin
git switch feature/native-crew-ios
git pull --ff-only origin feature/native-crew-ios
```

If the branch does not exist locally yet, use `git switch --track origin/feature/native-crew-ios`. Confirm it contains the native files:

```sh
git branch --show-current
git log -1 --oneline
ls ios
```

## 3. Test the package and generate the project

From the repository root:

```sh
swift test --package-path ios/CrewCore
cd ios
xcodegen generate
open Crew.xcodeproj
```

In Xcode, select the **Crew** scheme, choose an installed **iPhone simulator** in the destination menu, then choose **Product → Run** (Command-R). Do not choose “Any iOS Device” for the first run. For automated launch/navigation testing, choose **Product → Test** (Command-U). The UI test launches the app, checks the overview and each native tab, then relaunches to exercise reopening the SwiftData store. A screenshot is attached to the test result.

The app should open its native overview and attempt to read the existing public GitHub roster/activity and public schedule feeds. A network error must leave the native interface usable and explain that data is unavailable/cached. Unknown health and unavailable execution results are expected with the existing public feed.

## 4. Optional command-line simulator checks

These commands run from the `ios` directory. Do not add a global `-sdk iphonesimulator`: that also overrides the embedded Watch target's SDK.

```sh
xcodebuild -project Crew.xcodeproj -scheme Crew \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath DerivedData CODE_SIGNING_ALLOWED=NO build

xcodebuild -project Crew.xcodeproj -scheme CrewWatch \
  -destination 'generic/platform=watchOS Simulator' \
  -derivedDataPath DerivedData CODE_SIGNING_ALLOWED=NO build

xcrun simctl list devices available
```

Copy an available iPhone's UUID from that last command and substitute it below:

```sh
xcodebuild -project Crew.xcodeproj -scheme Crew \
  -destination 'platform=iOS Simulator,id=YOUR_IPHONE_SIMULATOR_UUID' \
  -derivedDataPath DerivedData -resultBundlePath SimulatorResults.xcresult \
  CODE_SIGNING_ALLOWED=NO test
```

Use a different result-bundle name for repeat runs if the previous result exists. Open a result in Xcode with `open SimulatorResults.xcresult`. To run the optional network integration check:

```sh
CREW_TEST_LIVE_FEEDS=1 swift test --package-path CrewCore
```

## 5. Settings you configure manually

A basic unsigned simulator build/test does **not** need production credentials or a paid Apple Developer membership. Device installation and entitlement-backed services need additional setup:

| Setting | Current value / required action |
|---|---|
| Development team | Empty in project.yml. Select your Apple team for device builds. |
| iPhone bundle ID | dev.jacksonwilson.crew; register or replace with your own unique ID. |
| Widget extension ID | dev.jacksonwilson.crew.widgets; use the same prefix as the app. |
| Watch companion ID | dev.jacksonwilson.crew.watch; keep its companion reference equal to the iPhone app ID. |
| UI test bundle ID | dev.jacksonwilson.crew.uitests; used only by tests. |
| App Group | group.dev.jacksonwilson.crew. Register/enable the same group on the iPhone and widget targets. Change both project.yml and Shared/SharedSnapshot.swift together if renaming. |
| Signing | Automatic, with matching provisioning profiles/capabilities for your team. Do not commit signing keys, certificates, or provisioning secrets. |
| Live Activities | NSSupportsLiveActivities is included in the generated app plist. Device settings/hardware and a verified task event source are still required; remote updates need a provider implementation. |
| APNs | Not configured. Requires push capability, device-token registration, and a secured APNs provider before remote notifications can work. |
| Firebase | Native sign-in is not configured. Register a native client, configure its app file/SDK, and test owner-only rules before enabling private data. |
| Grok / Head Quarter | No credentials needed for the public read-only slice. Authorized actions and reporting need their approved contracts/endpoints and Keychain credentials. |

Regenerate the project after editing `project.yml`; generated entitlements and plist files live under ignored `Generated/`. Simulator build success alone does not prove App Group sharing, widgets, Watch runtime, Siri, Keychain, notifications, or Live Activities work. Those need their corresponding runtime checks. No bot instructions, production writes, or deployments occur during the first simulator run.

## CI and troubleshooting

The **Native Crew** GitHub Actions workflow runs on branch pushes affecting native files. It runs package tests, generates the project, builds the iPhone/embedded targets and Watch simulator target, then runs the iPhone UI launch/navigation test and uploads its `.xcresult`. `workflow_dispatch` is declared, but GitHub's manual-run UI normally requires that declaration on the default branch; use native branch pushes while main remains unchanged.

If a simulator is missing, download its runtime through Xcode Settings. If SwiftData cannot open an old development store, capture the error first, then erase **only the Crew app** from the test simulator and relaunch; this discards that simulator's local cache/preferences. Do not reset a production device's data. If App Group access fails, the app reports a widget cache warning; verify entitlement/team alignment before claiming widget data sharing works.

See [build status](docs/FIRST_BUILD.md), [original inspection](docs/INSPECTION.md), [implementation inventory](docs/IMPLEMENTATION.md), and [integration boundaries](docs/INTEGRATIONS.md).
