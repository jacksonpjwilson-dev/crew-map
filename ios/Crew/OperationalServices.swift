import Foundation
import Security
import UserNotifications
import ActivityKit
import CrewCore
// Called only by a future authenticated task adapter after server confirmation.
@MainActor final class WorkflowActivities {
    private var activities: [String: Activity<WorkflowAttributes>] = [:]
    func start(taskID: String, name: String, bot: String, deadline: Date) throws {
        guard deadline > Date(), deadline.timeIntervalSinceNow <= 8 * 3600, activities[taskID] == nil,
              ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let content = ActivityContent(state: WorkflowAttributes.ContentState(state: "Running", progress: nil), staleDate: deadline)
        let activity = try Activity.request(attributes: WorkflowAttributes(deadline: deadline, taskID: taskID, name: name, botName: bot), content: content, pushType: nil)
        activities[taskID] = activity
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(max(0, deadline.timeIntervalSinceNow)))
            guard let self, self.activities[taskID] != nil else { return }
            await self.expire(taskID: taskID)
        }
    }
    private func expire(taskID: String) async {
        guard let activity = activities.removeValue(forKey: taskID) else { return }
        await activity.end(ActivityContent(state: .init(state: "Monitoring expired", progress: nil), staleDate: nil), dismissalPolicy: .immediate)
    }
    func update(taskID: String, state: String, progress: Double?) async {
        guard let activity = activities[taskID], activity.attributes.deadline > Date() else { return }
        await activity.update(ActivityContent(state: .init(state: state, progress: progress.map { min(1, max(0, $0)) }), staleDate: activity.attributes.deadline))
    }
    func recover() async {
        for activity in Activity<WorkflowAttributes>.activities {
            if activity.attributes.deadline <= Date() {
                await activity.end(ActivityContent(state: .init(state: "Expired", progress: nil), staleDate: nil), dismissalPolicy: .immediate)
            } else { activities[activity.attributes.taskID] = activity }
        }
    }
    func finish(taskID: String, failed: Bool) async {
        let activity = activities.removeValue(forKey: taskID) ?? Activity<WorkflowAttributes>.activities.first { $0.attributes.taskID == taskID }
        await activity?.end(ActivityContent(state: .init(state: failed ? "Failed" : "Completed", progress: failed ? nil : 1), staleDate: nil), dismissalPolicy: .after(Date().addingTimeInterval(60)))
    }
}
enum SecureCredential {
    static func store(_ data: Data, account: String) throws {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "Crew", kSecAttrAccount as String: account]
        let result = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if result == errSecItemNotFound {
            var item = query; item[kSecValueData as String] = data; item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { throw FeedError.unauthorized }
        } else if result != errSecSuccess { throw FeedError.unauthorized }
    }
    static func read(account: String) throws -> Data? {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "Crew", kSecAttrAccount as String: account, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw FeedError.unauthorized }
        return result as? Data
    }
    static func remove(account: String) throws {
        let status = SecItemDelete([kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "Crew", kSecAttrAccount as String: account] as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw FeedError.unauthorized }
    }
}
struct NotificationPolicy: Codable {
    var enabled = false
    var minimumSeverity = 2
    var quietStart = 22
    var quietEnd = 7
    func permits(severity: Int, date: Date) -> Bool {
        guard enabled, severity >= minimumSeverity else { return false }
        let hour = Calendar.current.component(.hour, from: date)
        let quiet = quietStart == quietEnd ? false : quietStart < quietEnd ? (quietStart..<quietEnd).contains(hour) : hour >= quietStart || hour < quietEnd
        return !quiet
    }
}
// Local alerts apply only while a verified integration supplies events; this is not a background monitor.
actor CrewNotifications {
    private let center = UNUserNotificationCenter.current()
    func requestPermission() async throws -> Bool { try await center.requestAuthorization(options: [.alert, .sound, .badge]) }
    func deliver(eventID: String, title: String, severity: Int, policy: NotificationPolicy) async throws {
        guard policy.permits(severity: severity, date: Date()) else { return }
        let key = "crew-notified:" + eventID
        guard !UserDefaults.standard.bool(forKey: key) else { return }
        let content = UNMutableNotificationContent(); content.title = title; content.body = "Open Crew to review the event."; content.sound = .default
        try await center.add(UNNotificationRequest(identifier: eventID, content: content, trigger: nil))
        UserDefaults.standard.set(true, forKey: key)
    }
}
protocol HeadquartersTransport: Sendable {
    // Implement with TLS, Keychain auth, server-side allowlist, and the approved Head Quarter contract.
    func send(_ report: HeadquartersReport) async throws
}
