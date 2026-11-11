import XCTest
@testable import CrewCore
final class CrewCoreTests: XCTestCase {
    func fixture<T: Decodable>(_ name: String) throws -> T {
        try JSONDecoder().decode(T.self, from: Data(contentsOf: Bundle.module.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")!))
    }
    func automation(_ time: String, kind: String? = nil) throws -> Automation {
        let object: [String: Any] = ["time": time, "who": ["dynamic-bot"], "note": "test", "kind": kind as Any? ?? NSNull()]
        return try JSONDecoder().decode(Automation.self, from: JSONSerialization.data(withJSONObject: object))
    }
    func testRealFeedsDecode() throws {
        let roster: Roster = try fixture("roster"); try roster.validate()
        XCTAssertFalse(roster.bots.isEmpty)
        let activity: ActivityFeed = try fixture("activity"); XCTAssertNotNil(activity.generatedAt)
        // The empty daily feed is valid and is not evidence of failed bots.
        XCTAssertEqual(HealthEvidence().state(now: Date()), .unknown)
    }
    func testPopulatedActivity() throws {
        let data = Data(#"{"date":"2026-11-11","generated":"08:00","items":[{"time":"07:59","from":"new-bot","to":"all","topic":"check","summary":"Recorded communication"}]}"#.utf8)
        let feed = try JSONDecoder().decode(ActivityFeed.self, from: data)
        XCTAssertEqual(feed.timestamp(feed.items[0]), Toronto.date("2026-11-11 07:59"))
    }
    func testDailyWeeklyMonthlyAndStrictlyFuture() throws {
        let now = Toronto.date("2026-11-11 00:05")!
        XCTAssertEqual(Scheduler.next(try automation("00:05"), after: now)?.date, Toronto.date("2026-11-12 00:05"))
        XCTAssertEqual(Scheduler.next(try automation("Sun 18:00"), after: now)?.date, Toronto.date("2026-11-15 18:00"))
        XCTAssertEqual(Scheduler.next(try automation("31st 18:00"), after: Toronto.date("2026-02-01 00:00")!)?.date, Toronto.date("2026-02-28 18:00"))
        XCTAssertNil(Scheduler.next(try automation("25:00"), after: now))
        XCTAssertNil(Scheduler.next(try automation("event driven"), after: now))
    }
    func testDSTAndTorontoOffset() throws {
        let run = Scheduler.next(try automation("08:00"), after: Toronto.date("2026-03-07 09:00")!)!
        XCTAssertEqual(run.date, Toronto.date("2026-03-08 08:00"))
        XCTAssertEqual(run.date.timeIntervalSince(Toronto.date("2026-03-07 08:00")!), 23*3600)
        let fall = Scheduler.next(try automation("08:00"), after: Toronto.date("2026-10-31 09:00")!)!
        XCTAssertEqual(fall.date.timeIntervalSince(Toronto.date("2026-10-31 08:00")!), 25*3600)
    }
    func testBriefingShiftAndFallback() throws {
        let a = try automation("08:00", kind: "briefing"), now = Toronto.date("2026-11-11 00:00")!
        XCTAssertEqual(Scheduler.next(a, after: now)?.exact, false)
        let shifts = try JSONDecoder().decode(ShiftFeed.self, from: Data(#"{"events":[{"date":"2026-11-11","start":"06:00","type":"chartright","label":"Shift"}]}"#.utf8))
        XCTAssertEqual(Scheduler.next(a, after: now, shifts: shifts)?.date, Toronto.date("2026-11-11 05:15"))
        XCTAssertEqual(Scheduler.next(a, after: now, shifts: shifts)?.exact, true)
    }
    func testCacheRoundtripStalenessAndMigrationRejection() throws {
        let roster: Roster = try fixture("roster"), activity: ActivityFeed = try fixture("activity")
        let snapshot = Snapshot(roster: roster, activity: activity, fetchedAt: activity.generatedAt!)
        let encoded = try JSONEncoder().encode(snapshot)
        let decoded = try Synchronizer.decodeCache(encoded)
        XCTAssertFalse(decoded.isStale(at: activity.generatedAt!.addingTimeInterval(60)))
        XCTAssertTrue(decoded.isStale(at: activity.generatedAt!.addingTimeInterval(90000)))
        var object = try XCTUnwrap(JSONSerialization.jsonObject(with: encoded) as? [String: Any]); object["schema"] = 99
        XCTAssertThrowsError(try Synchronizer.decodeCache(JSONSerialization.data(withJSONObject: object)))
    }
    func testEvidenceDoesNotInferDowntime() {
        let now = Date()
        XCTAssertEqual(HealthEvidence(success: now.addingTimeInterval(-90000)).state(now: now), .unknown)
        XCTAssertEqual(HealthEvidence(success: now).state(now: now), .healthy)
        XCTAssertEqual(HealthEvidence(failure: now).state(now: now), .error)
        XCTAssertEqual(HealthEvidence(explicitDown: true).state(now: now), .down)
        XCTAssertEqual(HealthEvidence(permissionProblem: true).state(now: now), .needsHelp)
    }
    func testDeepLinks() {
        XCTAssertEqual(CrewRoute(url: URL(string: "crew://bot/new-bot")!), .bot("new-bot"))
        XCTAssertNil(CrewRoute(url: URL(string: "https://bot/chief")!))
        XCTAssertNil(CrewRoute(url: URL(string: "crew://bot")!))
    }
    func testLivePublicFeedsWhenRequested() async throws {
        guard ProcessInfo.processInfo.environment["CREW_TEST_LIVE_FEEDS"] == "1" else { throw XCTSkip("Set CREW_TEST_LIVE_FEEDS=1 for network integration validation") }
        let snapshot = try await Synchronizer.fetch(from: PublicGitHubSource())
        XCTAssertFalse(snapshot.roster.bots.isEmpty)
        XCTAssertNotNil(snapshot.activity.generatedAt)
        _ = try await PublicShiftSource.fetch()
    }
    func testNetworkFailurePropagates() async {
        do { _ = try await Synchronizer.fetch(from: FailedSource()); XCTFail("Expected failure") }
        catch { XCTAssertTrue(error is URLError) }
    }
}
private struct FailedSource: FeedSource {
    func roster() async throws -> Roster { throw URLError(.notConnectedToInternet) }
    func activity() async throws -> ActivityFeed { throw URLError(.timedOut) }
}
