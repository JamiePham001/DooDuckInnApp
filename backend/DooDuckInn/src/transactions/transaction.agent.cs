namespace DooDuckInn.src.transactions;

using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;

// Thrown for: Claude refusal, malformed/unparseable structured output, an unrecognizable
// image, or any failure calling the Anthropic API (network, auth, rate limit). Controllers
// map this to 422 — distinct from 400 (bad request shape) and 404 (missing resource).
public class TransactionAgentException : Exception
{
    public TransactionAgentException() { }
    public TransactionAgentException(string message) : base(message) { }
    public TransactionAgentException(string message, Exception innerException) : base(message, innerException) { }
}

public class TransactionAgent(AnthropicClient client)
{
    // GLM-5.3-Flash via Z.ai's Anthropic-compatible endpoint (see Program.cs) — one model for
    // both tasks since that's the only tier in play right now. Split back into separate
    // match/scan constants if a cheaper GLM tier for the simple matching task shows up later.
    private const string ModelName = "glm-5.3-flash";

    public async Task<int> CheckExistsAsync(string scannedName, List<Transaction> transactions)
    {
        var schema = BuildSchema(new
        {
            id = new { type = "integer" }
        }, required: ["id"]);

        var candidates = string.Join("\n", transactions.Select(t => $"- id {t.Id}: {t.Name}"));

        var text = await CallAsync(schema, $"""
        Compare "{scannedName}" against this list of existing GST transaction names:
        {candidates}
        If any of them is a close match or carries a strong resemblance in meaning, return the
        corresponding id of that matched entry. Return -1 if there is no match.
        """);

        return ParseIntFromJson(text);
    }

    public async Task<(string Name, double Amount, double Gst, TransactionType Type)> ExtractFromImageAsync(
    byte[] imageBytes, string mediaType)
    {
        var schema = BuildSchema(new
        {
            name = new { type = "string" },
            amount = new { type = "number" },
            gst = new { type = "number" },
            type = new { type = "string", @enum = new[] { "Sale", "Purchase" } },
        }, required: ["name", "amount", "gst", "type"]);

        var text = await CallAsync(schema, imageBytes, mediaType,
            "Extract the transaction from this receipt/invoice image for a GST report: the merchant/item name, " +
            "the total amount charged, the GST amount charged (GST not found, set to 0), and whether it is a Sale (customer paid the shop) " +
            "or a Purchase (the shop paid a supplier). If this image is not a readable receipt " +
            "or invoice, respond with amount 0 and gst 0.");

        return ParseExtractionFromJson(text);
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
                // 200 wasn't enough — a live test against GLM hit max_tokens with zero visible
                // output at that cap, even for a trivial prompt (reasoning overhead eating the
                // budget before any answer text). 1000 is the smallest value confirmed to work.
                MaxTokens = 1000,
                OutputConfig = new OutputConfig { Format = new JsonOutputFormat { Schema = schema } },
                Messages = [new() { Role = Role.User, Content = new MessageParamContent(textPrompt, null) }],
            });
            return ExtractText(response);
        }
        catch (Exception ex) when (ex is not TransactionAgentException)
        {
            throw new TransactionAgentException($"Claude request failed: {ex.Message}");
        }
    }

    private async Task<string> CallAsync(
    Dictionary<string, JsonElement> schema, byte[] imageBytes, string mediaType, string instruction)
    {
        try
        {
            var response = await client.Messages.Create(new MessageCreateParams
            {
                Model = ModelName,
                MaxTokens = 1024,
                OutputConfig = new OutputConfig { Format = new JsonOutputFormat { Schema = schema } },
                Messages =
                [
                    new()
                    {
                        Role = Role.User,
                        Content = new MessageParamContent(
                            new List<ContentBlockParam>
                            {
                                new ImageBlockParam
                                {
                                    Source = new Base64ImageSource
                                    {
                                        Data = Convert.ToBase64String(imageBytes),
                                        MediaType = mediaType, // TODO: fix type from compiler error if needed
                                    },
                                },
                                new TextBlockParam { Text = instruction },
                            },
                            null),
                    },
                ],
            });
            return ExtractText(response);
        }
        catch (Exception ex) when (ex is not TransactionAgentException)
        {
            throw new TransactionAgentException($"Claude request failed: {ex.Message}");
        }
    }

    private static string ExtractText(Message response)
    {
        if (response.StopReason == "refusal")
            throw new TransactionAgentException("Claude declined to process this request.");

        return response.Content.Select(b => b.Value).OfType<TextBlock>().FirstOrDefault()?.Text
            ?? throw new TransactionAgentException("Claude returned no usable output.");
    }

    // public + static: no network call, directly unit-testable, no InternalsVisibleTo needed.
    public static TransactionType ParseTypeFromJson(string json)
    {
        try
        {
            var root = JsonDocument.Parse(json).RootElement;
            var typeStr = root.GetProperty("type").GetString()
                ?? throw new TransactionAgentException("Missing 'type' in classification response.");
            return Enum.Parse<TransactionType>(typeStr, ignoreCase: true);
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or ArgumentException)
        {
            throw new TransactionAgentException($"Could not parse classification response: {ex.Message}");
        }
    }

    public static int ParseIntFromJson(string json)
    {
        try
        {
            var root = JsonDocument.Parse(json).RootElement;
            var typeInt = root.GetProperty("id").GetInt32();
            return typeInt;
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or ArgumentException)
        {

            throw new TransactionAgentException($"Could not parse classification response: {ex.Message}");
        }
    }

    public static (string Name, double Amount, double Gst, TransactionType Type) ParseExtractionFromJson(string json)
    {
        try
        {
            var root = JsonDocument.Parse(json).RootElement;
            var name = root.GetProperty("name").GetString() ?? "";
            var amount = root.GetProperty("amount").GetDouble();
            var gst = root.GetProperty("gst").GetDouble();
            var type = Enum.Parse<TransactionType>(root.GetProperty("type").GetString()!, ignoreCase: true);

            if (string.IsNullOrWhiteSpace(name) || amount <= 0)
                throw new TransactionAgentException("Image does not appear to be a recognizable receipt/invoice.");

            return (name, amount, gst, type);
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or ArgumentException
            or InvalidOperationException)
        {
            throw new TransactionAgentException($"Could not parse extraction response: {ex.Message}");
        }
    }
}
