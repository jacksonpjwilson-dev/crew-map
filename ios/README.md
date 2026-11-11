# Crew native iOS

Native SwiftUI application alongside the existing Crew Map website. Targets iOS 17+ and watchOS 10+. The public roster remains authoritative; no bot directory is embedded in the application. Fixtures are test inputs only.

On a Mac with Xcode 16+ and XcodeGen:

```sh
brew install xcodegen
cd ios
swift test --package-path CrewCore
xcodegen generate
open Crew.xcodeproj
```

Select the Crew scheme and an iPhone simulator. For an unsigned build:

```sh
xcodebuild -project Crew.xcodeproj -scheme Crew \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

Set your development team, registered bundle IDs, and matching App Group identifiers in `project.yml` and `Shared/SharedSnapshot.swift` before a device build. Regenerate after changing the project specification. Generated projects, signing entitlements, and build outputs are ignored. The app embeds WidgetKit and Watch targets. Product artwork and release signing remain to be configured.

For live network validation:

```sh
CREW_TEST_LIVE_FEEDS=1 swift test --package-path CrewCore
```

Default tests are deterministic and skip the optional external network check. The GitHub native workflow runs shared tests and an unsigned Apple-platform build on macOS; it has been added locally and has not run on GitHub yet.

See [inspection](docs/INSPECTION.md), [implementation report](docs/IMPLEMENTATION.md), and [integration contract](docs/INTEGRATIONS.md) for evidence, configuration requirements, and limitations.
