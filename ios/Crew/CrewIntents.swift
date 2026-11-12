import AppIntents
import Foundation
struct OpenCrewIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Crew"
    static var openAppWhenRun = true
    @MainActor func perform() async throws -> some IntentResult { CrewIntentNavigation.request(URL(string: "crew://overview")!); return .result() }
}
struct ShowBotsIntent: AppIntent {
    static var title: LocalizedStringResource = "Show my Grok Bots"
    static var openAppWhenRun = true
    @MainActor func perform() async throws -> some IntentResult { CrewIntentNavigation.request(URL(string: "crew://bots")!); return .result() }
}
struct ShowUpcomingIntent: AppIntent {
    static var title: LocalizedStringResource = "Show upcoming tasks"
    static var openAppWhenRun = true
    @MainActor func perform() async throws -> some IntentResult { CrewIntentNavigation.request(URL(string: "crew://automations")!); return .result() }
}
struct ShowActivityIntent: AppIntent {
    static var title: LocalizedStringResource = "Show current bot activity"
    static var openAppWhenRun = true
    @MainActor func perform() async throws -> some IntentResult { CrewIntentNavigation.request(URL(string: "crew://activity")!); return .result() }
}
struct ShowGilesIntent: AppIntent {
    static var title: LocalizedStringResource = "Show G.I.L.E.S. status"
    static var openAppWhenRun = true
    @MainActor func perform() async throws -> some IntentResult { CrewIntentNavigation.request(URL(string: "crew://bot/chief")!); return .result() }
}
struct ShowFailedIntent: AppIntent {
    static var title: LocalizedStringResource = "Show failed automations"
    static var openAppWhenRun = true
    @MainActor func perform() async throws -> some IntentResult { CrewIntentNavigation.request(URL(string: "crew://failed")!); return .result() }
}
struct OpenBotIntent: AppIntent {
    static var title: LocalizedStringResource = "Open selected Crew bot"
    static var openAppWhenRun = true
    @Parameter(title: "Bot ID") var botID: String
    @MainActor func perform() async throws -> some IntentResult {
        var url = URLComponents(); url.scheme = "crew"; url.host = "bot"; url.path = "/" + botID
        guard let target = url.url else { throw CrewIntentError.invalidBot }
        CrewIntentNavigation.request(target)
        return .result()
    }
}
struct CrewShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: OpenCrewIntent(), phrases: ["Open \(.applicationName)"], shortTitle: "Open Crew", systemImageName: "person.3")
        AppShortcut(intent: ShowBotsIntent(), phrases: ["Show my bots in \(.applicationName)"], shortTitle: "My Bots", systemImageName: "person.3.sequence")
        AppShortcut(intent: ShowUpcomingIntent(), phrases: ["Show upcoming tasks in \(.applicationName)"], shortTitle: "Upcoming", systemImageName: "clock")
        AppShortcut(intent: ShowGilesIntent(), phrases: ["Show Giles in \(.applicationName)"], shortTitle: "G.I.L.E.S.", systemImageName: "bubble.left")
        AppShortcut(intent: ShowActivityIntent(), phrases: ["Show activity in \(.applicationName)"], shortTitle: "Activity", systemImageName: "waveform.path")
    }
}

enum CrewIntentError: Error { case invalidBot }

// iOS 17-compatible routing: openAppWhenRun brings the app forward, then the root
// consumes this request both on cold launch and when an existing scene is active.
@MainActor enum CrewIntentNavigation {
    static let notification = Notification.Name("CrewIntentRouteRequested")
    private static let key = "crew-pending-intent-url"
    static func request(_ url: URL) {
        UserDefaults.standard.set(url.absoluteString, forKey: key)
        NotificationCenter.default.post(name: notification, object: nil)
    }
    static func consume() -> URL? {
        guard let value = UserDefaults.standard.string(forKey: key) else { return nil }
        UserDefaults.standard.removeObject(forKey: key)
        return URL(string: value)
    }
}
