import ActivityKit
import WidgetKit
import SwiftUI
struct WorkflowLiveView: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkflowAttributes.self) { context in
            VStack(alignment: .leading) {
                Text(context.attributes.name).font(.headline)
                Text(context.attributes.botName)
                Text(context.state.state)
                if let progress = context.state.progress { ProgressView(value: min(1, max(0, progress))) }
            }.padding().widgetURL(URL(string: "crew://activity")).privacySensitive()
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Text(context.attributes.botName) }
                DynamicIslandExpandedRegion(.trailing) { Text(context.state.state) }
                DynamicIslandExpandedRegion(.bottom) { Text(context.attributes.name) }
            } compactLeading: { Image(systemName: "gearshape.2") } compactTrailing: { Text(context.state.state == "Running" ? "…" : "✓") } minimal: { Image(systemName: "gearshape.2") }
                .widgetURL(URL(string: "crew://activity"))
        }
    }
}
