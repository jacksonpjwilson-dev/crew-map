import Foundation
public struct Roster: Codable, Sendable {
    public let version: Int
    public let lead: Lead
    public let departments: [Department]
    public let bots: [Bot]
    public let groups: [Group]
    public let schedule: [Automation]
    public func validate() throws {
        guard version == 2, Set(bots.map(\.id)).count == bots.count else { throw FeedError.invalidRoster }
    }
}
public struct Lead: Codable, Sendable { public let id, name, role: String; public let about: String? }
public struct Department: Codable, Identifiable, Sendable { public let id, name, color: String; public let head: String? }
public struct Bot: Codable, Identifiable, Hashable, Sendable {
    public let id, name, role, tier, dept, shape, color, about: String
    public let reportsTo: String?
    public let dotted, runs: [String]
    public let hidden: Bool
}
public struct Group: Codable, Sendable { public let name: String; public let dept: String?; public let members: [String] }
public struct Automation: Codable, Identifiable, Sendable {
    public let time: String
    public let who: [String]
    public let note: String
    public let kind, detail: String?
    public var id: String { time + "|" + who.joined(separator: ",") + "|" + note }
}
public struct ActivityFeed: Codable, Sendable {
    public let date, generated: String
    public let items: [Interaction]
    public func timestamp(_ item: Interaction) -> Date? { Toronto.date(date + " " + item.time) }
    public var generatedAt: Date? { Toronto.date(date + " " + generated) }
}
public struct Interaction: Codable, Hashable, Sendable {
    public let time, from, to, topic, summary: String
}
public struct Snapshot: Codable, Sendable {
    public let schema: Int
    public let roster: Roster
    public let activity: ActivityFeed
    public let fetchedAt: Date
    public init(roster: Roster, activity: ActivityFeed, fetchedAt: Date = Date()) {
        schema = 1; self.roster = roster; self.activity = activity; self.fetchedAt = fetchedAt
    }
    // The publisher changes generated only when content changes. This is feed age, not a heartbeat.
    public func isStale(at now: Date = Date(), threshold: TimeInterval = 86400) -> Bool {
        guard let generated = activity.generatedAt else { return true }
        return generated.timeIntervalSince(now) > 300 || now.timeIntervalSince(generated) > threshold || now.timeIntervalSince(fetchedAt) > threshold
    }
}
public enum FeedError: Error { case invalidRoster, invalidActivity, http(Int), unsupportedCache, unauthorized }
public enum Health: String, CaseIterable, Sendable {
    case healthy = "Running Smoothly", needsHelp = "Needs Help", error = "Error", down = "Down", unknown = "Unknown"
}
public struct HealthEvidence: Sendable {
    public var heartbeat: Date?
    public var success: Date?
    public var failure: Date?
    public var explicitDown = false
    public var permissionProblem = false
    public init(heartbeat: Date? = nil, success: Date? = nil, failure: Date? = nil, explicitDown: Bool = false, permissionProblem: Bool = false) {
        self.heartbeat = heartbeat; self.success = success; self.failure = failure; self.explicitDown = explicitDown; self.permissionProblem = permissionProblem
    }
    public func state(now: Date, freshness: TimeInterval = 3600) -> Health {
        if explicitDown { return .down }
        if permissionProblem { return .needsHelp }
        let confirmed = [heartbeat, success].compactMap { $0 }.max()
        if let failure, now.timeIntervalSince(failure) <= freshness, failure <= now, confirmed == nil || failure > confirmed! { return .error }
        if let confirmed, confirmed <= now, now.timeIntervalSince(confirmed) <= freshness { return .healthy }
        return .unknown
    }
}
public enum CrewRoute: Equatable {
    case overview, bots, activity, automations, failed, bot(String)
    public init?(url: URL) {
        guard url.scheme == "crew" else { return nil }
        switch url.host {
        case "overview": self = .overview
        case "bots": self = .bots
        case "activity": self = .activity
        case "automations": self = .automations
        case "failed": self = .failed
        case "bot": guard let id = url.pathComponents.dropFirst().first, !id.isEmpty else { return nil }; self = .bot(id)
        default: return nil
        }
    }
}
