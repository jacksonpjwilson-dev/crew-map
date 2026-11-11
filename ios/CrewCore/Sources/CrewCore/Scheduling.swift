import Foundation
public enum Toronto {
    public static var calendar: Calendar { var c = Calendar(identifier: .gregorian); c.timeZone = TimeZone(identifier: "America/Toronto")!; return c }
    public static func date(_ value: String) -> Date? {
        let f = DateFormatter(); f.calendar = calendar; f.locale = Locale(identifier: "en_US_POSIX"); f.timeZone = calendar.timeZone; f.dateFormat = "yyyy-MM-dd HH:mm"; f.isLenient = false
        return f.date(from: value)
    }
}
public struct ShiftFeed: Codable, Sendable {
    public struct Shift: Codable, Sendable { public let date, start, type: String; public let label: String? }
    public let events: [Shift]
}
public struct ScheduledRun: Identifiable, Sendable {
    public let automation: Automation
    public let date: Date
    public let exact: Bool
    public var id: String { automation.id }
}
public enum Scheduler {
    public static func next(_ automation: Automation, after now: Date, shifts: ShiftFeed? = nil) -> ScheduledRun? {
        let parts = automation.time.split(separator: " ").map(String.init)
        guard let clock = parts.last else { return nil }
        let hm = clock.split(separator: ":").compactMap { Int($0) }
        guard hm.count == 2, (0...23).contains(hm[0]), (0...59).contains(hm[1]), parts.count <= 2 else { return nil }
        let c = Toronto.calendar
        let weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        var weekday: Int?, monthDay: Int?
        if parts.count == 2 {
            let token = parts[0].lowercased()
            if let index = weekdays.firstIndex(of: String(token.prefix(3))) { weekday = index + 1 }
            else {
                guard token.range(of: #"^\d{1,2}(st|nd|rd|th)$"#, options: .regularExpression) != nil,
                      let n = Int(token.prefix(while: { $0.isNumber })), (1...31).contains(n) else { return nil }
                monthDay = n
            }
        }
        let start = c.startOfDay(for: now)
        for offset in 0...370 {
            guard let day = c.date(byAdding: .day, value: offset, to: start) else { continue }
            if let weekday, c.component(.weekday, from: day) != weekday { continue }
            if let monthDay, let range = c.range(of: .day, in: .month, for: day), c.component(.day, from: day) != min(monthDay, range.count) { continue }
            var minutes = hm[0] * 60 + hm[1]
            var exact = automation.kind != "briefing"
            if automation.kind == "briefing", let shifts {
                let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = c.timeZone; f.calendar = c; f.locale = Locale(identifier: "en_US_POSIX")
                let key = f.string(from: day)
                let knownDates = shifts.events.compactMap { Toronto.date($0.date + " 00:00") }
                exact = knownDates.max().map { day <= $0 } ?? false
                let early = shifts.events.filter { $0.date == key && $0.type == "chartright" && !($0.label ?? "").localizedCaseInsensitiveContains("cont") }.compactMap { shift -> Int? in
                    let p = shift.start.split(separator: ":").compactMap { Int($0) }
                    guard p.count == 2, (0...23).contains(p[0]), (0...59).contains(p[1]) else { return nil }
                    let m = p[0] * 60 + p[1]; return m > 0 && m - 45 < 480 ? m : nil
                }.min()
                if let early { minutes = max(0, early - 45) }
            }
            // nextTime matches Foundation's DST gap policy; first occurrence wins in a repeated hour.
            guard let date = c.date(bySettingHour: minutes / 60, minute: minutes % 60, second: 0, of: day, matchingPolicy: .nextTime, repeatedTimePolicy: .first, direction: .forward) else { continue }
            // Match the web scheduler: the current minute is already due.
            if date > now { return ScheduledRun(automation: automation, date: date, exact: exact) }
        }
        return nil
    }
}
