import SwiftUI
import SwiftData
import CrewCore
import WidgetKit
@Model final class CacheRecord {
    @Attribute(.unique) var key: String
    var payload: Data
    init(payload: Data) { key = "snapshot-v1"; self.payload = payload }
}
@Model final class ShiftCacheRecord {
    @Attribute(.unique) var key: String
    var payload: Data
    var fetchedAt: Date
    init(payload: Data) { key = "shifts-v1"; self.payload = payload; fetchedAt = Date() }
}
@Model final class BotPreference {
    @Attribute(.unique) var botID: String
    var favourite: Bool
    init(botID: String, favourite: Bool) { self.botID = botID; self.favourite = favourite }
}
@MainActor @Observable final class CrewStore {
    let workflowActivities = WorkflowActivities()
    var snapshot: Snapshot?
    var shifts: ShiftFeed?
    var shiftFailure: String?
    var syncing = false
    var failure: String?
    var persistenceFailure: String?
    var selectedBot: Bot?
    var section = "Overview"
    var showFailures = false
    private var pendingURL: URL?
    private var context: ModelContext?
    func load(_ context: ModelContext) {
        guard self.context == nil else { return }
        self.context = context
        do {
            if let record = try context.fetch(FetchDescriptor<CacheRecord>()).first { snapshot = try Synchronizer.decodeCache(record.payload) }
            if let shiftRecord = try context.fetch(FetchDescriptor<ShiftCacheRecord>()).first, Date().timeIntervalSince(shiftRecord.fetchedAt) < 1800 {
                shifts = try JSONDecoder().decode(ShiftFeed.self, from: shiftRecord.payload)
            }
        } catch { persistenceFailure = "Cached data could not be loaded: \(error.localizedDescription)" }
    }
    func sync() async {
        guard !syncing else { return }
        syncing = true; defer { syncing = false }
        do {
            async let shiftFetch = PublicShiftSource.fetch()
            let fresh = try await Synchronizer.fetch(from: PublicGitHubSource())
            do { shifts = try await shiftFetch; shiftFailure = nil }
            catch { shifts = nil; shiftFailure = "Early-shift feed unavailable; briefing times are estimates." }
            snapshot = fresh; failure = nil
            if let url = pendingURL { pendingURL = nil; route(url) }
            do {
                guard let context else { return }
                let data = try JSONEncoder().encode(fresh)
                if let record = try context.fetch(FetchDescriptor<CacheRecord>()).first { record.payload = data }
                else { context.insert(CacheRecord(payload: data)) }
                if let shifts {
                    let shiftData = try JSONEncoder().encode(shifts)
                    if let record = try context.fetch(FetchDescriptor<ShiftCacheRecord>()).first { record.payload = shiftData; record.fetchedAt = Date() }
                    else { context.insert(ShiftCacheRecord(payload: shiftData)) }
                }
                try context.save(); persistenceFailure = nil
            } catch { persistenceFailure = "Offline cache could not be saved: \(error.localizedDescription)" }
            do { try SharedSnapshot.write(fresh); WidgetCenter.shared.reloadAllTimelines() }
            catch { persistenceFailure = "Widget cache unavailable. Check App Group configuration." }
        } catch { failure = "Sync failed. Showing the last saved data, if available. \(error.localizedDescription)" }
    }
    var bots: [Bot] { snapshot?.roster.bots ?? [] }
    func name(_ id: String) -> String { bots.first { $0.id == id }?.name ?? (snapshot?.roster.lead.id == id ? snapshot?.roster.lead.name : nil) ?? StaticFlow.appNames[id] ?? id }
    var upcoming: [ScheduledRun] { (snapshot?.roster.schedule ?? []).compactMap { Scheduler.next($0, after: Date(), shifts: shifts) }.sorted { $0.date < $1.date } }
    func route(_ url: URL) {
        guard let route = CrewRoute(url: url) else { return }
        switch route {
        case .overview: section = "Overview"
        case .bots: section = "Bots"
        case .activity: section = "Activity"
        case .automations: showFailures = false; section = "Automations"
        case .failed: showFailures = true; section = "Automations"
        case .bot(let id):
            if snapshot == nil { pendingURL = url }
            selectedBot = bots.first { $0.id == id }; section = "Bots"
        }
    }
}
