import SwiftUI
import CrewCore
@main struct CrewWatchApp: App {
    var body: some Scene { WindowGroup { WatchOverview() } }
}
struct WatchOverview: View {
    @State private var snapshot: Snapshot?
    @State private var failure: String?
    @State private var syncing = false
    @AppStorage("watchFavouriteID") private var favourite = ""
    private var cacheURL: URL { URL.documentsDirectory.appendingPathComponent("crew-watch-v1.json") }
    var body: some View {
        NavigationStack {
            List {
                Label("Crew", systemImage: "circle.hexagongrid.fill").font(.headline).foregroundStyle(.teal)
                Text("Health unknown").font(.headline)
                if let snapshot {
                    Text("\(snapshot.roster.bots.count) bots")
                    if snapshot.isStale() { Text("Stale feed").foregroundStyle(.orange) }
                    Picker("Favourite", selection: $favourite) { Text("None").tag(""); ForEach(snapshot.roster.bots) { Text($0.name).tag($0.id) } }
                    if let bot = snapshot.roster.bots.first(where: { $0.id == favourite }) { NavigationLink(bot.name) { VStack { Text(bot.name); Text(bot.role); Text("Operational status unknown") } } }
                    Section("Next up") {
                        ForEach(snapshot.roster.schedule.compactMap { Scheduler.next($0, after: Date()) }.sorted { $0.date < $1.date }.prefix(3)) { run in VStack(alignment: .leading) { Text(run.automation.note); Text(run.date, style: .relative).font(.caption); if !run.exact { Text("Estimated").font(.caption) } } }
                    }
                    Text("Active workflows and alerts require an authorized event integration.").font(.caption)
                } else { Text("Open or refresh to load the public crew feed.") }
                if let failure { Text(failure).font(.caption).foregroundStyle(.orange) }
                Button("Refresh") { Task { await sync() } }.disabled(syncing)
            }.navigationTitle("Crew").privacySensitive()
        }.task {
            if let data = try? Data(contentsOf: cacheURL) { snapshot = try? Synchronizer.decodeCache(data) }
            await sync()
        }
    }
    @MainActor private func sync() async {
        guard !syncing else { return }; syncing = true; defer { syncing = false }
        do {
            let fresh = try await Synchronizer.fetch(from: PublicGitHubSource()); snapshot = fresh
            try JSONEncoder().encode(fresh).write(to: cacheURL, options: .atomic); failure = nil
        } catch { failure = "Sync failed; showing saved data if available." }
    }
}
