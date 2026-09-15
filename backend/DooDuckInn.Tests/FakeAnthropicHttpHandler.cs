using System.Net;
using System.Text;
using System.Text.Json;
using Anthropic;
using Anthropic.Core;

namespace DooDuckInn.Tests;

// Stands in for the real Anthropic API over HTTP, so TransactionAgent tests never make a network
// call. AnthropicClient's ClientOptions.HttpClient is a plain settable HttpClient, so pointing it
// at a fake handler is enough — no need to touch TransactionAgent's constructor at all.
public class FakeAnthropicHttpHandler(string responseBody, HttpStatusCode statusCode = HttpStatusCode.OK)
    : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(responseBody, Encoding.UTF8, "application/json"),
        };
        return Task.FromResult(response);
    }

    public static AnthropicClient BuildClient(string responseBody, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var httpClient = new HttpClient(new FakeAnthropicHttpHandler(responseBody, statusCode))
        {
            BaseAddress = new Uri("https://api.anthropic.com"),
        };
        return new AnthropicClient(new ClientOptions { ApiKey = "test-key", HttpClient = httpClient });
    }

    // A minimal, valid Anthropic Messages API response wrapping the given text as the model's
    // structured-output content — this is what TransactionAgent.ExtractText/ParseXFromJson consume.
    public static string BuildMessageResponse(string textContent, string stopReason = "end_turn") =>
        JsonSerializer.Serialize(new
        {
            id = "msg_test123",
            type = "message",
            role = "assistant",
            model = "claude-haiku-4.5",
            content = new[] { new { type = "text", text = textContent } },
            stop_reason = stopReason,
            stop_sequence = (string?)null,
            usage = new { input_tokens = 10, output_tokens = 5 },
        });
}
