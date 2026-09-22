using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Gmail.v1;
using Google.Apis.Services;

namespace DooDuckInn.src.digests;

public record InboxEmail(string MessageId, string SenderName, string SenderEmail, string Subject,
    string Snippet, DateTimeOffset ReceivedAt);

public class GmailClient(IConfiguration config)
{
    private string RequireConfig(string key) =>
        config[key] ?? throw new InvalidOperationException($"Missing configuration value '{key}'.");

    public async Task<List<InboxEmail>> FetchRecentAsync(int maxResults = 20)
    {
        var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = RequireConfig("Gmail:ClientId"),
                ClientSecret = RequireConfig("Gmail:ClientSecret"),
            },
            Scopes = [GmailService.Scope.GmailReadonly],
        });
        var credential = new UserCredential(flow, "doo-duck-inn",
            new TokenResponse { RefreshToken = RequireConfig("Gmail:RefreshToken") });
        // UserCredential auto-refreshes the access token from the refresh token before each
        // call if expired — no manual refresh-token grant plumbing needed.

        using var gmail = new GmailService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "DooDuckInn",
        });

        var listRequest = gmail.Users.Messages.List("me");
        listRequest.MaxResults = maxResults;
        listRequest.LabelIds = "INBOX";
        var list = await listRequest.ExecuteAsync();
        if (list.Messages is null) return [];

        // ponytail: fetches messages one-by-one instead of batching — fine at ~20 emails/day,
        // switch to Gmail's batch HTTP endpoint if this job's runtime ever becomes a problem.
        var results = new List<InboxEmail>();
        foreach (var m in list.Messages)
        {
            var msg = await gmail.Users.Messages.Get("me", m.Id).ExecuteAsync();
            var headers = msg.Payload.Headers;
            var from = headers.FirstOrDefault(h => h.Name == "From")?.Value ?? "Unknown";
            var subject = headers.FirstOrDefault(h => h.Name == "Subject")?.Value ?? "(no subject)";
            var (senderName, senderEmail) = ParseFrom(from);
            results.Add(new InboxEmail(m.Id, senderName, senderEmail, subject,
                msg.Snippet ?? "", DateTimeOffset.FromUnixTimeMilliseconds(msg.InternalDate ?? 0)));
        }
        return results;
    }

    // "Name <a@b.com>" -> (Name, a@b.com); falls back to the raw header for a bare address.
    private static (string Name, string Email) ParseFrom(string headerValue)
    {
        var match = System.Text.RegularExpressions.Regex.Match(headerValue, @"^(.*?)\s*<(.+)>$");
        return match.Success
            ? (match.Groups[1].Value.Trim('"', ' '), match.Groups[2].Value)
            : (headerValue, headerValue);
    }
}
