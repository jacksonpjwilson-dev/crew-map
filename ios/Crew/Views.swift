import SwiftUI
import SwiftData
import Charts
import CrewCore
struct CrewRoot: View {
    @Environment(CrewStore.self) private var store
    @Environment(\.modelContext) private var context
    @Environment(\.scenePhase) private var phase
    @AppStorage("accent") private var accent = "Teal"
    var body: some View {
        @Bindable var store = store
        TabView(selection: $store.section) {
            NavigationStack { Overview() }.tabItem { Label("Overview", systemImage: "square.grid.2x2") }.tag("Overview")
            NavigationStack { Directory() }.tabItem { Label("Bots", systemImage: "person.3") }.tag("Bots")
            NavigationStack { Organization() }.tabItem { Label("Organization", systemImage: "point.3.connected.trianglepath.dotted") }.tag("Organization")
            NavigationStack { ActivityScreen() }.tabItem { Label("Activity", systemImage: "waveform.path") }.tag("Activity")
            NavigationStack { Automations() }.tabItem { Label("Automations", systemImage: "clock") }.tag("Automations")
        }.tint(accent == "Violet" ? .purple : accent == "Coral" ? .orange : .teal)
        .sheet(item: $store.selectedBot) { bot in NavigationStack { BotProfile(bot: bot).toolbar { Button("Done") { store.selectedBot = nil } } } }
        .onReceive(NotificationCenter.default.publisher(for: CrewIntentNavigation.notification)) { _ in consumeIntentRoute() }
        .task { store.load(context); consumeIntentRoute(); await store.workflowActivities.recover(); await store.sync() }
        .onChange(of: phase) { _, value in if value == .active { consumeIntentRoute(); Task { await store.sync() } } }
    }
    private func consumeIntentRoute() { if let url = CrewIntentNavigation.consume() { store.route(url) } }
}
struct Overview: View {
    @Environment(CrewStore.self) private var store
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    Label("YOUR GROK BOT ORGANIZATION", systemImage: "circle.hexagongrid.fill").font(.caption).foregroundStyle(.secondary)
                    Text("Crew, at a glance").font(.largeTitle.bold())
                    Text("One place to follow your bots, their work, and what comes next.").foregroundStyle(.secondary)
                }.padding(.vertical, 10)
                if let s = store.snapshot {
                    Label(s.isStale() ? "Feed information is stale" : "Public feed loaded", systemImage: s.isStale() ? "clock.badge.exclamationmark" : "arrow.triangle.2.circlepath").foregroundStyle(s.isStale() ? .orange : .secondary)
                    LabeledContent("Last successful sync", value: s.fetchedAt.formatted())
                    Text("Feed generated \(s.activity.date) at \(s.activity.generated), Toronto time. Feed age is not a service heartbeat.").font(.caption).foregroundStyle(.secondary)
                }
                if let failure = store.failure { Text(failure).foregroundStyle(.orange) }
                if let failure = store.shiftFailure { Text(failure).foregroundStyle(.orange) }
                if let failure = store.persistenceFailure { Text(failure).foregroundStyle(.orange) }
                if store.snapshot == nil { ContentUnavailableView("Connect your crew", systemImage: "network", description: Text("Refresh to load the existing GitHub data feed.")) }
            }
            Section("Organization") {
                NavigationLink { Directory() } label: { LabeledContent("Bots", value: "\(store.bots.count)") }
                NavigationLink { Monitoring() } label: { LabeledContent("Confirmed healthy", value: "Unknown") }
                NavigationLink { Monitoring() } label: { LabeledContent("Requiring attention", value: "Unknown") }
                NavigationLink { Automations() } label: { LabeledContent("Defined schedules", value: "\(store.snapshot?.roster.schedule.count ?? 0)") }
                LabeledContent("Active / successful / failed tasks", value: "Unavailable")
            }
            Section("Next up · America/Toronto") { ForEach(store.upcoming.prefix(3)) { RunRow(run: $0) } }
            Section("Recent communication") { ForEach(Array((store.snapshot?.activity.items ?? []).suffix(3).reversed().enumerated()), id: \.offset) { _, item in InteractionRow(item: item) } }
            Section { NavigationLink("Monitoring") { Monitoring() }; NavigationLink("Usage") { UsageScreen() }; NavigationLink("Appearance & integrations") { SettingsScreen() } }
        }.navigationTitle("Crew").refreshable { await store.sync() }
        .toolbar { Button { Task { await store.sync() } } label: { Image(systemName: "arrow.clockwise") }.disabled(store.syncing) }
    }
}
struct BotRow: View {
    let bot: Bot
    var body: some View {
        HStack(spacing: 12) {
            Text(String(bot.name.prefix(1))).font(.headline).frame(width: 42, height: 42).background(Color.bot(bot.color).opacity(0.17), in: RoundedRectangle(cornerRadius: 13)).foregroundStyle(Color.bot(bot.color))
            VStack(alignment: .leading) { Text(bot.name).font(.headline); Text(bot.role).font(.caption).foregroundStyle(.secondary) }
            Spacer(); Image(systemName: "circle.fill").font(.caption2).foregroundStyle(.gray).accessibilityLabel("Operational status unknown")
        }.padding(.vertical, 4)
    }
}
struct Directory: View {
    @Environment(CrewStore.self) private var store
    @Query private var preferences: [BotPreference]
    @State private var search = ""
    @State private var department = "All"
    @State private var role = "All"
    @State private var favourites = false
    @State private var status = "All"
    var filtered: [Bot] { store.bots.filter { b in
        (search.isEmpty || "\(b.name) \(b.role) \(b.about)".localizedCaseInsensitiveContains(search)) && (department == "All" || b.dept == department) && (status == "All" || status == Health.unknown.rawValue) && (role == "All" || b.role == role) && (!favourites || preferences.contains { $0.botID == b.id && $0.favourite })
    } }
    var body: some View {
        List {
            Section {
                Picker("Department", selection: $department) { Text("All").tag("All"); ForEach(store.snapshot?.roster.departments ?? []) { Text($0.name).tag($0.id) } }
                Picker("Role", selection: $role) { Text("All").tag("All"); ForEach(Array(Set(store.bots.map(\.role))).sorted(), id: \.self) { Text($0).tag($0) } }
                Picker("Status", selection: $status) { Text("All").tag("All"); ForEach(Health.allCases, id: \.self) { Text($0.rawValue).tag($0.rawValue) } }
                Toggle("Favourites only", isOn: $favourites)
                Text("Status: Unknown · no health evidence source configured").font(.caption).foregroundStyle(.secondary)
            }
            ForEach(filtered) { bot in NavigationLink { BotProfile(bot: bot) } label: { BotRow(bot: bot) } }
        }.searchable(text: $search).navigationTitle("Your bots")
    }
}
struct BotProfile: View {
    @Environment(CrewStore.self) private var store
    @Environment(\.modelContext) private var context
    @Query private var preferences: [BotPreference]
    let bot: Bot
    var body: some View {
        List {
            Section { BotRow(bot: bot); Text(bot.about); LabeledContent("Department", value: store.snapshot?.roster.departments.first { $0.id == bot.dept }?.name ?? bot.dept)
                LabeledContent("Reports to", value: bot.reportsTo.map(store.name) ?? "Unassigned")
                if bot.id == "chief" { Text("G.I.L.E.S. — Grossly Intelligent, Less Expensive System — is Chief’s conversational personality.") }
                Toggle("Favourite", isOn: Binding(get: { preferences.first { $0.botID == bot.id }?.favourite ?? false }, set: { value in
                    if let p = preferences.first(where: { $0.botID == bot.id }) { p.favourite = value } else { context.insert(BotPreference(botID: bot.id, favourite: value)) }
                    do { try context.save() } catch { store.persistenceFailure = "Favourite could not be saved." }
                }))
            }
            Section("Relationships") {
                ForEach(store.bots.filter { $0.reportsTo == bot.id || bot.dotted.contains($0.id) }) { BotRow(bot: $0) }
                ForEach((store.snapshot?.roster.groups ?? []).filter { $0.members.contains(bot.id) }, id: \.name) { group in
                    VStack(alignment: .leading) { Text(group.name).font(.headline); Text(group.members.map(store.name).joined(separator: ", ")).font(.caption) }
                }
                ForEach(StaticFlow.all.filter { $0.from == bot.id || $0.to == bot.id }) { flow in Text("\(store.name(flow.from)) → \(store.name(flow.to)): \(flow.label)") }
            }
            Section("Schedules") { ForEach(store.upcoming.filter { $0.automation.who.contains(bot.id) }) { RunRow(run: $0) } }
            Section("Recorded communication") { ForEach(Array((store.snapshot?.activity.items ?? []).filter { $0.from == bot.id || $0.to == bot.id }.reversed().enumerated()), id: \.offset) { _, item in InteractionRow(item: item) } }
            Section("Interaction") {
                Text("No authorized Grok instruction API or verified bot conversation link is configured.")
                Text("Sending instructions, voice chat, execution tracking, and remote configuration are unavailable.").foregroundStyle(.secondary)
                Text("Last confirmed operational event: Unknown. Messages alone do not establish successful execution.").font(.caption)
            }
        }.navigationTitle(bot.name)
    }
}
struct RunRow: View {
    @Environment(CrewStore.self) private var store
    let run: ScheduledRun
    var body: some View {
        NavigationLink {
            List { Text(run.automation.note); Text(run.automation.who.map(store.name).joined(separator: ", ")); Text("Schedule: \(run.automation.time) · America/Toronto"); Text(run.date.formatted()); Text(run.exact ? "Calculated from the published schedule." : "Estimated briefing: early shift data is not configured."); Text("Enabled state, last result, execution history, and remote controls are unavailable in this feed.") }.navigationTitle("Automation")
        } label: {
            VStack(alignment: .leading, spacing: 5) { Text(run.automation.note).font(.headline); Text(run.automation.who.map(store.name).joined(separator: ", ")).font(.caption).foregroundStyle(.secondary); Text(run.date, style: .relative).font(.caption.monospacedDigit()); if !run.exact { Text("Estimated · early shift adjustment unavailable").font(.caption).foregroundStyle(.orange) } }
        }
    }
}
struct Automations: View {
    @Environment(CrewStore.self) private var store
    var body: some View { List { Section { if store.showFailures { Text("Failed automation results are unavailable: the existing feed has no execution outcome records.").foregroundStyle(.orange) }; Text("Expected runs from the published roster. A schedule is not proof that an automation is enabled or running.").font(.caption).foregroundStyle(.secondary) }; ForEach(store.upcoming) { RunRow(run: $0) } }.navigationTitle("Automations").refreshable { await store.sync() } }
}
struct InteractionRow: View {
    @Environment(CrewStore.self) private var store
    let item: Interaction
    var body: some View { VStack(alignment: .leading, spacing: 5) { Text("\(store.name(item.from)) → \(store.name(item.to))").font(.headline); Text(item.topic).font(.subheadline); Text(item.summary).font(.callout).foregroundStyle(.secondary); Text("\(store.snapshot?.activity.date ?? "") \(item.time) · Toronto").font(.caption.monospacedDigit()) }.padding(.vertical, 5) }
}
struct ActivityScreen: View {
    @Environment(CrewStore.self) private var store
    @State private var search = ""
    @State private var bot = "All"
    @State private var topic = "All"
    @State private var day = Date()
    @State private var filterDay = false
    var items: [Interaction] { (store.snapshot?.activity.items ?? []).filter { i in
        (bot == "All" || i.from == bot || i.to == bot) && (topic == "All" || i.topic == topic) && (search.isEmpty || "\(i.topic) \(i.summary) \(store.name(i.from)) \(store.name(i.to))".localizedCaseInsensitiveContains(search)) && (!filterDay || store.snapshot?.activity.timestamp(i).map { Toronto.calendar.isDate($0, inSameDayAs: day) } == true)
    } }
    var body: some View { List {
        Section { Picker("Bot", selection: $bot) { Text("All").tag("All"); ForEach(store.bots) { Text($0.name).tag($0.id) } }; Picker("Topic", selection: $topic) { Text("All").tag("All"); ForEach(Array(Set((store.snapshot?.activity.items ?? []).map(\.topic))).sorted(), id: \.self) { Text($0).tag($0) } }; Toggle("Filter date", isOn: $filterDay); if filterDay { DatePicker("Date", selection: $day, displayedComponents: .date).environment(\.timeZone, Toronto.calendar.timeZone) }; Text("The publisher supplies one day of sanitized messages. Execution results, errors, and historical archives are not provided.").font(.caption).foregroundStyle(.secondary) }
        NavigationLink("Communication frequency") { CommunicationScreen() }
        if items.isEmpty { ContentUnavailableView("No recorded messages", systemImage: "bubble.left.and.bubble.right") }
        ForEach(Array(items.reversed().enumerated()), id: \.offset) { _, item in InteractionRow(item: item) }
    }.searchable(text: $search).navigationTitle("Activity").refreshable { await store.sync() } }
}
struct CommunicationScreen: View {
    @Environment(CrewStore.self) private var store
    var counts: [(String, Int)] { Dictionary(grouping: store.snapshot?.activity.items ?? [], by: { "\(store.name($0.from)) → \(store.name($0.to))" }).map { ($0.key, $0.value.count) }.sorted { $0.1 > $1.1 } }
    var body: some View { List { Text("Recorded interactions for \(store.snapshot?.activity.date ?? "the loaded day"). Static relationships are shown separately in Organization.").font(.caption); Chart(counts, id: \.0) { pair in BarMark(x: .value("Messages", pair.1), y: .value("Direction", pair.0)).foregroundStyle(.teal) }.frame(height: max(180, CGFloat(counts.count * 40))); ForEach(counts, id: \.0) { pair in LabeledContent(pair.0, value: "\(pair.1)") } }.navigationTitle("Communication") }
}
struct Monitoring: View {
    @Environment(CrewStore.self) private var store
    var body: some View { List { Section { Text("All bot health is Unknown until a verified execution or heartbeat integration supplies evidence. Feed connectivity is tracked separately."); if let failure = store.failure { Text(failure).foregroundStyle(.orange) } }; ForEach(store.bots) { bot in NavigationLink { BotProfile(bot: bot) } label: { BotRow(bot: bot) } }; Section("Health legend") { ForEach(Health.allCases, id: \.self) { health in Label { Text(health.rawValue) } icon: { Image(systemName: "circle.fill").foregroundStyle(health.color) } } } }.navigationTitle("Monitoring") }
}
struct UsageScreen: View {
    @Environment(CrewStore.self) private var store
    var body: some View { List { LabeledContent("Recorded messages", value: "\(store.snapshot?.activity.items.count ?? 0)"); Text("Execution counts, AI quotas, costs, resource consumption, and usage trends are not present in the existing feed. Message counts are not execution counts.") }.navigationTitle("Usage") }
}
struct SettingsScreen: View {
    @AppStorage("appearance") private var appearance = "System"
    @AppStorage("accent") private var accent = "Teal"
    var body: some View { Form { Section("Appearance") { Picker("Mode", selection: $appearance) { ForEach(["System", "Light", "Dark"], id: \.self) { Text($0) } }; Picker("Accent", selection: $accent) { ForEach(["Teal", "Violet", "Coral"], id: \.self) { Text($0) } } }; Section("Data & privacy") { Text("Source: public crew-map data branch. Only sanitized roster and activity feeds are downloaded. Cached information remains available offline."); Text("Briefing timing uses the existing public schedule feed and retains only the fields needed to calculate early shifts. Widgets and Watch show estimates when shift data is unavailable."); Text("Private Firestore sign-in requires a native Firebase app registration and tested owner rules. Public mode must not be used for private conversations.") }; Section("Integrations") { NavigationLink("Notifications") { NotificationSettings() }; Text("Remote operations, APNs, Head Quarter transport, and authenticated Firestore are not configured. No remote changes can be made.") } }.navigationTitle("Settings") }
}
extension Color {
    static func bot(_ name: String) -> Color {
        let palette = ["yellow":"F5C518", "blue":"4A90E2", "green":"3BA55C", "orange":"FF9F1C", "cyan":"2EC4D6", "violet":"9B5DE5", "red":"E63946", "magenta":"E040A0", "teal":"1BA7A7", "lime":"84CC16", "pink":"FF8FA3", "gold":"E0A83A", "sky":"38BDF8", "white":"9CA3AF", "coral":"e06a3a", "indigo":"6366F1"]
        let hex = palette[name] ?? name.replacingOccurrences(of: "#", with: "")
        guard let v = UInt64(hex, radix: 16) else { return .gray }
        return Color(red: Double((v >> 16) & 255)/255, green: Double((v >> 8) & 255)/255, blue: Double(v & 255)/255)
    }
}

extension Health {
    var color: Color {
        switch self { case .healthy: return .green; case .needsHelp: return .yellow; case .error: return .orange; case .down: return .red; case .unknown: return .gray }
    }
}
