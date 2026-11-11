import Foundation
import CrewCore
// Provision endpoint + approved host list out of band once Head Quarter's contract is agreed.
// This adapter never exports conversations, bot names, or credentials in its report body.
actor HeadquartersAdapter: HeadquartersTransport {
    private let endpoint: URL
    private let credentialAccount: String
    init(endpoint: URL, approvedHosts: Set<String>, credentialAccount: String) throws {
        guard endpoint.scheme == "https", let host = endpoint.host, approvedHosts.contains(host),
              endpoint.user == nil, endpoint.password == nil, endpoint.query == nil, endpoint.fragment == nil else { throw FeedError.unauthorized }
        self.endpoint = endpoint; self.credentialAccount = credentialAccount
    }
    func send(_ report: HeadquartersReport) async throws {
        guard let credential = try SecureCredential.read(account: credentialAccount),
              let token = String(data: credential, encoding: .utf8), !token.isEmpty else { throw FeedError.unauthorized }
        var request = URLRequest(url: endpoint, timeoutInterval: 15)
        request.httpMethod = "POST"
        request.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(report)
        let session = URLSession(configuration: .ephemeral, delegate: RejectRedirects(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (_, response) = try await session.data(for: request)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else { throw FeedError.http((response as? HTTPURLResponse)?.statusCode ?? 0) }
    }
}
private final class RejectRedirects: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
