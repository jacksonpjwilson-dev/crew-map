import Foundation
import CrewCore
public enum SharedSnapshot {
    // Replace in entitlements and both targets together for your Apple team.
    public static let group = "group.dev.jacksonwilson.crew"
    public static var url: URL? { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)?.appendingPathComponent("snapshot-v1.json") }
    public static func read() -> Snapshot? {
        guard let url, let data = try? Data(contentsOf: url) else { return nil }
        return try? Synchronizer.decodeCache(data)
    }
    public static func write(_ snapshot: Snapshot) throws {
        guard let url else { throw CocoaError(.fileNoSuchFile) }
        try JSONEncoder().encode(snapshot).write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
}
