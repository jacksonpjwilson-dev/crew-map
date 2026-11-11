import ActivityKit
import Foundation
struct WorkflowAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var state: String
        var progress: Double?
    }
    let deadline: Date
    let taskID: String
    let name: String
    let botName: String
}
