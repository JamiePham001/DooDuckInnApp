namespace DooDuckInn.src.digests;

using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;

public class DigestAgentException : Exception
{
    public DigestAgentException() { }
    public DigestAgentException(string message) : base(message) { }
    public DigestAgentException(string message, Exception innerException) : base(message, innerException) { }
}

public class DigestAgent(AnthropicClient client)
{
    private const string ModelName = "glm-5.3-flash";

    public async Task<(DigestPriority Priority, string Summary)> SummarizeAsync(
        string senderName, string subject, string snippet)
    {
        var schema = BuildSchema(new
        {
            priority = new { type = "string", @enum = new[] { "Critical", "High", "Medium", "Low" } },
            summary = new { type = "string" },
        }, required: ["priority", "summary"]);

        var text = await CallAsync(schema, $"""
        You are triaging inbox email for a takeaway shop owner for business and personal. Sender: "{senderName}".
        Subject: "{subject}". Preview: "{snippet}".
        Classify urgency (Critical = needs action today/urgent supplier or compliance issue,
        High = important but not urgent, Medium = routine, Low = newsletter/promo/noise) and
        write a one-sentence plain-English summary of what this email is about.
        """);

        return ParseFromJson(text);
    }

    private static Dictionary<string, JsonElement> BuildSchema(object properties, string[] required) => new()
    {
        ["type"] = JsonSerializer.SerializeToElement("object"),
        ["properties"] = JsonSerializer.SerializeToElement(properties),
        ["required"] = JsonSerializer.SerializeToElement(required),
    };

    private async Task<string> CallAsync(Dictionary<string, JsonElement> schema, string textPrompt)
    {
        try
        {
            var response = await client.Messages.Create(new MessageCreateParams
            {
                Model = ModelName,
                MaxTokens = 1000,
                OutputConfig = new OutputConfig { Format = new JsonOutputFormat { Schema = schema } },
                Messages = [new() { Role = Role.User, Content = new MessageParamContent(textPrompt, null) }],
            });
            return ExtractText(response);
        }
        catch (Exception ex) when (ex is not DigestAgentException)
        {
            throw new DigestAgentException($"Claude request failed: {ex.Message}");
        }
    }

    private static string ExtractText(Message response)
    {
        if (response.StopReason == "refusal")
            throw new DigestAgentException("Claude declined to process this request.");

        return response.Content.Select(b => b.Value).OfType<TextBlock>().FirstOrDefault()?.Text
            ?? throw new DigestAgentException("Claude returned no usable output.");
    }

    public static (DigestPriority Priority, string Summary) ParseFromJson(string json)
    {
        try
        {
            var root = JsonDocument.Parse(json).RootElement;
            var priority = Enum.Parse<DigestPriority>(root.GetProperty("priority").GetString()!, ignoreCase: true);
            var summary = root.GetProperty("summary").GetString() ?? "";
            return (priority, summary);
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or ArgumentException)
        {
            throw new DigestAgentException($"Could not parse digest response: {ex.Message}");
        }
    }
}
