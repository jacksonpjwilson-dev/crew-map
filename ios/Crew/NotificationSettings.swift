import SwiftUI
struct NotificationSettings: View {
    @AppStorage("notification-policy-v1") private var policyData = Data()
    @State private var policy = NotificationPolicy()
    @State private var status = ""
    var body: some View {
        Form {
            Section {
                Toggle("Enable verified event alerts", isOn: $policy.enabled)
                Picker("Minimum severity", selection: $policy.minimumSeverity) { Text("Information").tag(1); Text("Warning").tag(2); Text("Critical").tag(3) }
                Stepper("Quiet hours start: \(policy.quietStart):00", value: $policy.quietStart, in: 0...23)
                Stepper("Quiet hours end: \(policy.quietEnd):00", value: $policy.quietEnd, in: 0...23)
                Text("Quiet hours follow this device’s timezone. Equal start and end disables quiet hours.").font(.caption)
                Button("Allow notifications on this iPhone") {
                    Task { do { status = try await CrewNotifications().requestPermission() ? "Permission granted" : "Permission not granted" } catch { status = error.localizedDescription } }
                }
                if !status.isEmpty { Text(status) }
            }
            Section { Text("Preferences are saved locally. No event source or remote push service is configured. This app does not infer failures from bot silence. Reliable background delivery requires a server event processor and APNs.") }
        }.navigationTitle("Notifications")
        .onAppear { policy = (try? JSONDecoder().decode(NotificationPolicy.self, from: policyData)) ?? NotificationPolicy() }
        .onChange(of: policy.enabled) { save() }
        .onChange(of: policy.minimumSeverity) { save() }
        .onChange(of: policy.quietStart) { save() }
        .onChange(of: policy.quietEnd) { save() }
    }
    private func save() { if let data = try? JSONEncoder().encode(policy) { policyData = data } }
}
