import Foundation
struct StaticFlow: Identifiable {
 let from, to, label: String
 let bidirectional: Bool
 var id: String { from + "|" + to + "|" + label }
 static let appNames = ["logbook": "Logbook", "stack": "Stack", "briefing": "Briefing site", "pantry": "Pantry", "runs": "runs.jsonl"]
 static let all: [StaticFlow] = [
StaticFlow(from: "cal", to: "sunny", label: "schedule", bidirectional: false),
StaticFlow(from: "remi", to: "sunny", label: "to-do", bidirectional: false),
StaticFlow(from: "indie", to: "sunny", label: "mail", bidirectional: false),
StaticFlow(from: "penny", to: "sunny", label: "balances", bidirectional: false),
StaticFlow(from: "scout", to: "sunny", label: "top jobs", bidirectional: false),
StaticFlow(from: "sunny", to: "briefing", label: "publishes", bidirectional: false),
StaticFlow(from: "penny", to: "stack", label: "money", bidirectional: false),
StaticFlow(from: "runs", to: "quinn", label: "all bots log", bidirectional: false),
StaticFlow(from: "quinn", to: "felix", label: "fixes", bidirectional: false),
StaticFlow(from: "atlas", to: "penny", label: "reads", bidirectional: false),
StaticFlow(from: "atlas", to: "cal", label: "reads", bidirectional: false),
StaticFlow(from: "atlas", to: "remi", label: "reads", bidirectional: false),
StaticFlow(from: "atlas", to: "logbook", label: "reads", bidirectional: false),
StaticFlow(from: "sally", to: "logbook", label: "reads", bidirectional: false),
StaticFlow(from: "sally", to: "pantry", label: "reads", bidirectional: false),
StaticFlow(from: "ace", to: "scout", label: "study ↔ jobs", bidirectional: true),
StaticFlow(from: "felix", to: "logbook", label: "maintains", bidirectional: false),
StaticFlow(from: "felix", to: "stack", label: "maintains", bidirectional: false),
StaticFlow(from: "felix", to: "briefing", label: "maintains", bidirectional: false),
StaticFlow(from: "felix", to: "pantry", label: "maintains", bidirectional: false),
StaticFlow(from: "toby", to: "runs", label: "usage", bidirectional: false)]
}
