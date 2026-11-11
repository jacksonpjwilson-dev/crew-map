// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "CrewCore", platforms: [.iOS(.v17), .macOS(.v14), .watchOS(.v10)], products: [.library(name: "CrewCore", targets: ["CrewCore"])], targets: [.target(name: "CrewCore"), .testTarget(name: "CrewCoreTests", dependencies: ["CrewCore"], resources: [.copy("Fixtures")])])
