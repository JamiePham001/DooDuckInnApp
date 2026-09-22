using System.Net;
using DooDuckInn.src.digests;

namespace DooDuckInn.Tests;

// Mirrors TransactionAgentTests: every test mocks the Anthropic HTTP layer via
// FakeAnthropicHttpHandler, never a real network call.
public class DigestAgentTests
{
    [Fact]
    public async Task SummarizeAsync_ReturnsPriorityAndSummary_OnValidResponse()
    {
        var responseText = """{"priority":"Critical","summary":"Supplier says delivery is delayed."}""";
        var client = FakeAnthropicHttpHandler.BuildClient(FakeAnthropicHttpHandler.BuildMessageResponse(responseText));
        var agent = new DigestAgent(client);

        var result = await agent.SummarizeAsync("Supplier Co", "Delivery delay", "Your order will be late...");

        Assert.Equal(DigestPriority.Critical, result.Priority);
        Assert.Equal("Supplier says delivery is delayed.", result.Summary);
    }

    [Fact]
    public async Task SummarizeAsync_Throws_WhenClaudeRefuses()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("", stopReason: "refusal"));
        var agent = new DigestAgent(client);

        await Assert.ThrowsAsync<DigestAgentException>(
            () => agent.SummarizeAsync("Sender", "Subject", "Snippet"));
    }

    [Fact]
    public async Task SummarizeAsync_Throws_WhenResponseIsMalformedJson()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("not valid json"));
        var agent = new DigestAgent(client);

        await Assert.ThrowsAsync<DigestAgentException>(
            () => agent.SummarizeAsync("Sender", "Subject", "Snippet"));
    }

    [Fact]
    public async Task SummarizeAsync_Throws_WhenHttpCallFails()
    {
        var client = FakeAnthropicHttpHandler.BuildClient("Internal Server Error", HttpStatusCode.InternalServerError);
        var agent = new DigestAgent(client);

        await Assert.ThrowsAsync<DigestAgentException>(
            () => agent.SummarizeAsync("Sender", "Subject", "Snippet"));
    }
}

// Pure unit tests for the static parse helper — no network, no mocking needed at all.
public class DigestAgentParsingTests
{
    [Fact]
    public void ParseFromJson_ReturnsFields_ForValidJson()
    {
        var result = DigestAgent.ParseFromJson("""{"priority":"High","summary":"Invoice due next week."}""");

        Assert.Equal(DigestPriority.High, result.Priority);
        Assert.Equal("Invoice due next week.", result.Summary);
    }

    [Theory]
    [InlineData("Critical", DigestPriority.Critical)]
    [InlineData("high", DigestPriority.High)]
    [InlineData("Medium", DigestPriority.Medium)]
    [InlineData("LOW", DigestPriority.Low)]
    public void ParseFromJson_ParsesAllPriorityValues_CaseInsensitively(string raw, DigestPriority expected)
    {
        var result = DigestAgent.ParseFromJson($$"""{"priority":"{{raw}}","summary":"x"}""");

        Assert.Equal(expected, result.Priority);
    }

    [Fact]
    public void ParseFromJson_Throws_WhenPriorityIsInvalidEnumValue() =>
        Assert.Throws<DigestAgentException>(() =>
            DigestAgent.ParseFromJson("""{"priority":"Urgent","summary":"x"}"""));

    [Fact]
    public void ParseFromJson_Throws_WhenPriorityMissing() =>
        Assert.Throws<DigestAgentException>(() =>
            DigestAgent.ParseFromJson("""{"summary":"x"}"""));

    [Fact]
    public void ParseFromJson_Throws_ForMalformedJson() =>
        Assert.Throws<DigestAgentException>(() => DigestAgent.ParseFromJson("not json"));
}
