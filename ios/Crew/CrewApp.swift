import SwiftUI
import SwiftData
@main struct CrewApp: App {
    @State private var store = CrewStore()
    @AppStorage("appearance") private var appearance = "System"
    var body: some Scene {
        WindowGroup {
            CrewRoot().environment(store)
                .preferredColorScheme(appearance == "Dark" ? .dark : appearance == "Light" ? .light : nil)
                .onOpenURL { store.route($0) }
        }.modelContainer(for: [CacheRecord.self, ShiftCacheRecord.self, BotPreference.self])
    }
}
