import XCTest
final class LaunchTests: XCTestCase {
    func testLaunchAndNativeNavigation() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["Crew, at a glance"].waitForExistence(timeout: 20), "Crew must launch with its native overview even without network data")
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Crew-first-launch"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.tabBars.buttons["Bots"].tap()
        XCTAssertTrue(app.navigationBars["Your bots"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Organization"].tap()
        XCTAssertTrue(app.segmentedControls.buttons["Tree"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Activity"].tap()
        XCTAssertTrue(app.navigationBars["Activity"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Automations"].tap()
        XCTAssertTrue(app.navigationBars["Automations"].waitForExistence(timeout: 5))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["Crew, at a glance"].waitForExistence(timeout: 20), "Persisted SwiftData storage must reopen successfully")
    }
}
