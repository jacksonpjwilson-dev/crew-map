import SwiftUI
import WidgetKit
import AppIntents
import CrewCore
struct CrewWidgetConfiguration: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Crew overview"
    static var description = IntentDescription("Choose a bot from your roster using its stable ID.")
    @Parameter(title: "Favourite bot ID", default: "") var botID: String
}
struct CrewEntry: TimelineEntry { let date: Date; let snapshot: Snapshot?; let botID: String }
struct CrewProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> CrewEntry { CrewEntry(date: Date(), snapshot: nil, botID: "") }
    func snapshot(for configuration: CrewWidgetConfiguration, in context: Context) async -> CrewEntry { CrewEntry(date: Date(), snapshot: SharedSnapshot.read(), botID: configuration.botID) }
    func timeline(for configuration: CrewWidgetConfiguration, in context: Context) async -> Timeline<CrewEntry> {
        let entry = await snapshot(for: configuration, in: context)
        return Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800)))
    }
}
struct CrewWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: CrewEntry
    var bot: Bot? { entry.snapshot?.roster.bots.first { $0.id == entry.botID } }
    var next: ScheduledRun? { entry.snapshot?.roster.schedule.compactMap { Scheduler.next($0, after: entry.date) }.min { $0.date < $1.date } }
    var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                VStack { Image(systemName: "person.3"); Text("?") }.accessibilityLabel("Crew health unknown")
            case .accessoryInline:
                Text("\(bot?.name ?? "Crew"): status unknown")
            case .accessoryRectangular:
                VStack(alignment: .leading) { Text("Crew · Health unknown").font(.headline); if let next { Text(next.automation.note).lineLimit(1); Text(next.date, style: .time) } else { Text("Open Crew to sync") } }
            default:
                VStack(alignment: .leading, spacing: 8) {
                    Label("Crew", systemImage: "circle.hexagongrid.fill").font(.headline).foregroundStyle(.teal)
                    Text(bot?.name ?? "\(entry.snapshot?.roster.bots.count ?? 0) bots").font(.title2.bold())
                    Text("Health unknown").font(.caption)
                    if entry.snapshot == nil { Text("Open Crew to sync").font(.caption) }
                    else if entry.snapshot?.isStale(at: entry.date) == true { Text("Stale feed").font(.caption).foregroundStyle(.orange) }
                    if family != .systemSmall {
                        if let next { Text("Next: \(next.automation.note)").lineLimit(2); Text(next.date, style: .relative).font(.caption) }
                        Text("Active bots & errors: unavailable").font(.caption).foregroundStyle(.secondary)
                    }
                    if family == .systemLarge { ForEach(Array((entry.snapshot?.activity.items ?? []).suffix(3).enumerated()), id: \.offset) { _, item in Text("\(item.from) → \(item.to): \(item.topic)").font(.caption).lineLimit(1) } }
                }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }.containerBackground(.fill.tertiary, for: .widget)
        .widgetURL(URL(string: bot.map { "crew://bot/\($0.id)" } ?? "crew://overview"))
        .privacySensitive()
    }
}
struct CrewWidgets: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "CrewOverview", intent: CrewWidgetConfiguration.self, provider: CrewProvider()) { CrewWidgetView(entry: $0) }
            .configurationDisplayName("Crew overview").description("Cached bot organization and upcoming schedules. Health requires an evidence source.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

@main struct CrewWidgetBundle: WidgetBundle { var body: some Widget { CrewWidgets(); WorkflowLiveView() } }
