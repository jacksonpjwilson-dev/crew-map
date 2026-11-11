import SwiftUI
import CrewCore
struct Organization: View {
    @Environment(CrewStore.self) private var store
    @State private var mode = "Tree"
    var body: some View {
        VStack {
            Picker("Organization view", selection: $mode) { Text("Tree").tag("Tree"); Text("Map").tag("Map") }.pickerStyle(.segmented).padding(.horizontal)
            if mode == "Tree" {
                List {
                    if let roster = store.snapshot?.roster {
                        Section(roster.lead.name) {
                            ForEach(store.bots.filter { $0.reportsTo == roster.lead.id || $0.reportsTo == nil || !store.bots.map(\.id).contains($0.reportsTo ?? "") }) { bot in TreeNode(bot: bot, ancestors: []) }
                        }
                        Section("Departments") { ForEach(roster.departments) { department in LabeledContent(department.name, value: department.head.map(store.name) ?? "Unassigned") } }
                        Section("Group chats") { ForEach(roster.groups, id: \.name) { group in VStack(alignment: .leading) { Text(group.name).font(.headline); Text(group.members.map(store.name).joined(separator: ", ")).font(.caption) } } }
                    }
                }
            } else { OrgGraph() }
        }.navigationTitle("Organization")
    }
}
struct TreeNode: View {
    @Environment(CrewStore.self) private var store
    let bot: Bot
    let ancestors: Set<String>
    @State private var expanded = true
    var children: [Bot] { store.bots.filter { $0.reportsTo == bot.id && !ancestors.contains($0.id) && $0.id != bot.id } }
    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            ForEach(children) { child in TreeNode(bot: child, ancestors: ancestors.union([bot.id])) }
        } label: { Button { store.selectedBot = bot } label: { BotRow(bot: bot) }.buttonStyle(.plain) }
    }
}
struct OrgGraph: View {
    @Environment(CrewStore.self) private var store
    @State private var zoom: CGFloat = 1
    @GestureState private var magnification: CGFloat = 1
    @State private var showFlows = true
    private let size: CGFloat = 1200
    var nodes: [String] {
        let bots = store.bots.map(\.id)
        let lead = store.snapshot.map { [$0.roster.lead.id] } ?? []
        let appIDs = Set(StaticFlow.appNames.keys)
        let apps = Set(StaticFlow.all.filter { bots.contains($0.from) || bots.contains($0.to) }.flatMap { [$0.from, $0.to] }).intersection(appIDs)
        return lead + bots + apps.sorted()
    }
    func point(_ id: String) -> CGPoint {
        let index = nodes.firstIndex(of: id) ?? 0
        let angle = Double(index) / Double(max(nodes.count, 1)) * .pi * 2 - .pi / 2
        return CGPoint(x: size / 2 + cos(angle) * 460, y: size / 2 + sin(angle) * 460)
    }
    var body: some View {
        VStack {
            Toggle("Static data flows (dashed)", isOn: $showFlows).padding(.horizontal)
            Text("Solid: reports to · Purple dotted: collaboration · Arrows: static flow direction. Recorded messages are in Activity.").font(.caption).foregroundStyle(.secondary).padding(.horizontal)
            ScrollView([.horizontal, .vertical]) {
                ZStack {
                    Canvas { context, _ in
                        func line(_ from: String, _ to: String, color: Color, dash: [CGFloat], arrows: Bool = false) {
                            guard nodes.contains(from), nodes.contains(to) else { return }
                            let a = point(from), b = point(to)
                            var path = Path(); path.move(to: a); path.addLine(to: b)
                            context.stroke(path, with: .color(color.opacity(0.55)), style: StrokeStyle(lineWidth: 1.5, dash: dash))
                            if arrows {
                                let t: CGFloat = 0.65
                                let p = CGPoint(x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t)
                                let angle = atan2(b.y-a.y, b.x-a.x)
                                var arrow = Path(); arrow.move(to: CGPoint(x: p.x - 10*cos(angle - 0.4), y: p.y - 10*sin(angle - 0.4))); arrow.addLine(to: p); arrow.addLine(to: CGPoint(x: p.x - 10*cos(angle + 0.4), y: p.y - 10*sin(angle + 0.4)))
                                context.stroke(arrow, with: .color(color), lineWidth: 2)
                            }
                        }
                        for bot in store.bots {
                            if let parent = bot.reportsTo { line(bot.id, parent, color: .secondary, dash: []) }
                            for other in bot.dotted { line(bot.id, other, color: .purple, dash: [2, 4]) }
                        }
                        if showFlows { for flow in StaticFlow.all { line(flow.from, flow.to, color: .teal, dash: [7, 5], arrows: true); if flow.bidirectional { line(flow.to, flow.from, color: .teal, dash: [7, 5], arrows: true) } } }
                    }
                    ForEach(nodes, id: \.self) { id in
                        Button { store.selectedBot = store.bots.first { $0.id == id } } label: {
                            VStack { Circle().fill(Color.bot(store.bots.first { $0.id == id }?.color ?? "white")).frame(width: 18, height: 18); Text(store.name(id)).font(.caption.bold()) }.padding(8).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                        }.buttonStyle(.plain).position(point(id)).disabled(!store.bots.contains { $0.id == id })
                    }
                }.frame(width: size, height: size).scaleEffect(zoom * magnification).frame(width: size * zoom, height: size * zoom)
            }.simultaneousGesture(MagnifyGesture().updating($magnification) { value, state, _ in state = value.magnification }.onEnded { zoom = min(2.5, max(0.4, zoom * $0.magnification)) })
            HStack { Button("Zoom out") { zoom = max(0.4, zoom - 0.2) }; Button("Reset") { zoom = 1 }; Button("Zoom in") { zoom = min(2.5, zoom + 0.2) } }.buttonStyle(.bordered)
        }
    }
}
