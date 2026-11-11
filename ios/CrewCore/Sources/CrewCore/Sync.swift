import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
public protocol FeedSource: Sendable {
    func roster() async throws -> Roster
    func activity() async throws -> ActivityFeed
}
public struct PublicGitHubSource: FeedSource {
    public init() {}
    private func read<T: Decodable>(_ file: String) async throws -> T {
        let url = URL(string: "https://raw.githubusercontent.com/jacksonpjwilson-dev/crew-map/data/" + file)!
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw FeedError.http(0) }
        guard response.statusCode == 200 else { throw FeedError.http(response.statusCode) }
        return try JSONDecoder().decode(T.self, from: data)
    }
    public func roster() async throws -> Roster { let r: Roster = try await read("roster.json"); try r.validate(); return r }
    public func activity() async throws -> ActivityFeed {
        let a: ActivityFeed = try await read("activity.json")
        guard a.generatedAt != nil, a.items.allSatisfy({ a.timestamp($0) != nil }) else { throw FeedError.invalidActivity }
        return a
    }
}
public enum Synchronizer {
    public static func fetch(from source: any FeedSource) async throws -> Snapshot {
        async let roster = source.roster()
        async let activity = source.activity()
        let snapshot = try await Snapshot(roster: roster, activity: activity)
        try snapshot.roster.validate()
        guard snapshot.activity.generatedAt != nil else { throw FeedError.invalidActivity }
        return snapshot
    }
    public static func decodeCache(_ data: Data) throws -> Snapshot {
        let snapshot = try JSONDecoder().decode(Snapshot.self, from: data)
        guard snapshot.schema == 1 else { throw FeedError.unsupportedCache }
        try snapshot.roster.validate()
        guard snapshot.activity.generatedAt != nil, snapshot.activity.items.allSatisfy({ snapshot.activity.timestamp($0) != nil }) else { throw FeedError.invalidActivity }
        return snapshot
    }
}
// Implement only against an approved server contract. No guessed Grok endpoints.
public protocol AuthorizedOperations: Sendable {
    func sendInstruction(botID: String, text: String) async throws -> String
    func trigger(automationID: String) async throws -> String
}
public struct HeadquartersReport: Codable, Sendable {
    public let buildVersion: String
    public let lastSuccessfulSync: Date?
    public let feedGeneratedAt: Date?
    public let backendFailure: Bool
    public let authenticationProblem: Bool
    public init(buildVersion: String, snapshot: Snapshot?, backendFailure: Bool, authenticationProblem: Bool) {
        self.buildVersion = buildVersion; lastSuccessfulSync = snapshot?.fetchedAt; feedGeneratedAt = snapshot?.activity.generatedAt
        self.backendFailure = backendFailure; self.authenticationProblem = authenticationProblem
    }
}

public enum PublicShiftSource {
    public static func fetch() async throws -> ShiftFeed {
        let url = URL(string: "https://jacksonpjwilson-dev.github.io/schedule/data/schedule.json")!
        let (data, response) = try await URLSession.shared.data(for: URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15))
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { throw FeedError.http((response as? HTTPURLResponse)?.statusCode ?? 0) }
        return try JSONDecoder().decode(ShiftFeed.self, from: data)
    }
}
