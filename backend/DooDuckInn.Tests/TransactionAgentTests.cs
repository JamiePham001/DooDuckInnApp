using System.Net;
using DooDuckInn.src.transactions;

namespace DooDuckInn.Tests;

// Every test here mocks the Anthropic HTTP layer via FakeAnthropicHttpHandler — never a real
// network call, per the requirement that AI workflow tests must not hit the Anthropic API.
public class TransactionAgentTests
{
    [Fact]
    public async Task ExtractFromImageAsync_ReturnsExtractedFields_OnValidResponse()
    {
        var responseText = """{"name":"Bunnings Warehouse","amount":220.0,"gst":20.0,"type":"Purchase"}""";
        var client = FakeAnthropicHttpHandler.BuildClient(FakeAnthropicHttpHandler.BuildMessageResponse(responseText));
        var agent = new TransactionAgent(client);

        var result = await agent.ExtractFromImageAsync([1, 2, 3], "image/jpeg");

        Assert.Equal("Bunnings Warehouse", result.Name);
        Assert.Equal(220.0, result.Amount);
        Assert.Equal(20.0, result.Gst);
        Assert.Equal(TransactionType.Purchase, result.Type);
    }

    [Fact]
    public async Task ExtractFromImageAsync_Throws_WhenClaudeRefuses()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("", stopReason: "refusal"));
        var agent = new TransactionAgent(client);

        await Assert.ThrowsAsync<TransactionAgentException>(
            () => agent.ExtractFromImageAsync([1, 2, 3], "image/jpeg"));
    }

    [Fact]
    public async Task ExtractFromImageAsync_Throws_WhenResponseIsMalformedJson()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("not valid json"));
        var agent = new TransactionAgent(client);

        await Assert.ThrowsAsync<TransactionAgentException>(
            () => agent.ExtractFromImageAsync([1, 2, 3], "image/jpeg"));
    }

    [Fact]
    public async Task ExtractFromImageAsync_Throws_WhenImageIsNotARecognizableReceipt()
    {
        // Prompt asks Claude to respond with amount 0 when the image isn't a real receipt —
        // ParseExtractionFromJson's amount<=0 guard should catch that and refuse to create garbage.
        var responseText = """{"name":"","amount":0,"gst":0,"type":"Sale"}""";
        var client = FakeAnthropicHttpHandler.BuildClient(FakeAnthropicHttpHandler.BuildMessageResponse(responseText));
        var agent = new TransactionAgent(client);

        await Assert.ThrowsAsync<TransactionAgentException>(
            () => agent.ExtractFromImageAsync([1, 2, 3], "image/jpeg"));
    }

    [Fact]
    public async Task ExtractFromImageAsync_Throws_WhenHttpCallFails()
    {
        var client = FakeAnthropicHttpHandler.BuildClient("Internal Server Error", HttpStatusCode.InternalServerError);
        var agent = new TransactionAgent(client);

        await Assert.ThrowsAsync<TransactionAgentException>(
            () => agent.ExtractFromImageAsync([1, 2, 3], "image/jpeg"));
    }

    [Fact]
    public async Task CheckExistsAsync_ReturnsMatchedId_WhenClaudeFindsAMatch()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("""{"id":5}"""));
        var agent = new TransactionAgent(client);

        var result = await agent.CheckExistsAsync("Western Power",
            [new Transaction(1, "Electrical Bill", 100, 10, TransactionType.Purchase)]);

        Assert.Equal(5, result);
    }

    [Fact]
    public async Task CheckExistsAsync_ReturnsNegativeOne_WhenNoMatch()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("""{"id":-1}"""));
        var agent = new TransactionAgent(client);

        var result = await agent.CheckExistsAsync("Completely Unrelated",
            [new Transaction(1, "Western Power", 100, 10, TransactionType.Purchase)]);

        Assert.Equal(-1, result);
    }

    [Fact]
    public async Task CheckExistsAsync_Throws_WhenResponseIsMalformedJson()
    {
        var client = FakeAnthropicHttpHandler.BuildClient(
            FakeAnthropicHttpHandler.BuildMessageResponse("not json"));
        var agent = new TransactionAgent(client);

        await Assert.ThrowsAsync<TransactionAgentException>(
            () => agent.CheckExistsAsync("Anything", []));
    }
}

// Pure unit tests for the static parse helpers — no network, no mocking needed at all.
public class TransactionAgentParsingTests
{
    [Fact]
    public void ParseIntFromJson_ReturnsId_ForValidJson() =>
        Assert.Equal(7, TransactionAgent.ParseIntFromJson("""{"id":7}"""));

    [Fact]
    public void ParseIntFromJson_ReturnsNegativeOne_ForNoMatchSentinel() =>
        Assert.Equal(-1, TransactionAgent.ParseIntFromJson("""{"id":-1}"""));

    [Fact]
    public void ParseIntFromJson_Throws_ForMalformedJson() =>
        Assert.Throws<TransactionAgentException>(() => TransactionAgent.ParseIntFromJson("not json"));

    [Fact]
    public void ParseIntFromJson_Throws_WhenIdPropertyMissing() =>
        Assert.Throws<TransactionAgentException>(() => TransactionAgent.ParseIntFromJson("""{"foo":1}"""));

    [Fact]
    public void ParseExtractionFromJson_ReturnsFields_ForValidJson()
    {
        var result = TransactionAgent.ParseExtractionFromJson(
            """{"name":"Telstra","amount":99.5,"gst":9.05,"type":"Purchase"}""");

        Assert.Equal("Telstra", result.Name);
        Assert.Equal(99.5, result.Amount);
        Assert.Equal(9.05, result.Gst);
        Assert.Equal(TransactionType.Purchase, result.Type);
    }

    [Fact]
    public void ParseExtractionFromJson_Throws_WhenAmountIsZero() =>
        Assert.Throws<TransactionAgentException>(() =>
            TransactionAgent.ParseExtractionFromJson("""{"name":"","amount":0,"gst":0,"type":"Sale"}"""));

    [Fact]
    public void ParseExtractionFromJson_Throws_WhenAmountIsNegative() =>
        Assert.Throws<TransactionAgentException>(() =>
            TransactionAgent.ParseExtractionFromJson("""{"name":"Test","amount":-5,"gst":0,"type":"Sale"}"""));

    [Fact]
    public void ParseExtractionFromJson_Throws_WhenNameIsBlank() =>
        Assert.Throws<TransactionAgentException>(() =>
            TransactionAgent.ParseExtractionFromJson("""{"name":"   ","amount":10,"gst":1,"type":"Sale"}"""));

    [Fact]
    public void ParseExtractionFromJson_Throws_WhenTypeIsInvalidEnumValue() =>
        Assert.Throws<TransactionAgentException>(() =>
            TransactionAgent.ParseExtractionFromJson("""{"name":"Test","amount":10,"gst":1,"type":"NotARealType"}"""));

    [Fact]
    public void ParseExtractionFromJson_Throws_ForMalformedJson() =>
        Assert.Throws<TransactionAgentException>(() => TransactionAgent.ParseExtractionFromJson("not json"));
}
