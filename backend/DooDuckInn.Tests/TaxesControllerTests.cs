using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

// Taxes drive the quarterly GST report, so this gets more edge-case coverage than the other
// controllers: invalid date ranges, boundary dates, ownership isolation between users, and
// behavior for users with no tax records.
public class TaxesControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<HttpClient> NewUserClientAsync(string sub)
    {
        var client = factory.CreateAuthedClient(sub);
        await client.PostAsync("/api/users", content: null);
        return client;
    }

    private static async Task<TaxDto> CreateTaxAsync(HttpClient client, string start = "2026-07-01", string end = "2026-09-30")
    {
        var response = await client.PostAsJsonAsync("/api/users/me/taxes", new { dateStart = start, dateEnd = end });
        return (await response.Content.ReadFromJsonAsync<TaxDto>())!;
    }

    [Fact]
    public async Task CreateTax_ReturnsBadRequest_WhenEndDateBeforeStartDate()
    {
        var client = await NewUserClientAsync("tax-sub-1");

        var response = await client.PostAsJsonAsync("/api/users/me/taxes",
            new { dateStart = "2026-09-30", dateEnd = "2026-07-01" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTax_ReturnsBadRequest_WhenEndDateEqualsStartDate()
    {
        var client = await NewUserClientAsync("tax-sub-2");

        var response = await client.PostAsJsonAsync("/api/users/me/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-07-01" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsTax_WhenExists()
    {
        var client = await NewUserClientAsync("tax-sub-3");
        var tax = await CreateTaxAsync(client);

        var response = await client.GetAsync($"/api/taxes/{tax.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("tax-sub-4");

        var response = await client.GetAsync("/api/taxes/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("tax-sub-owner-1");
        var tax = await CreateTaxAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("tax-sub-stranger-1");

        var response = await strangerClient.GetAsync($"/api/taxes/{tax.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetTransactionsByTaxId_ReturnsSeededEssentialRows_ForFreshTax()
    {
        // TaxesService.CreateAsync pre-seeds every new tax period with the essential
        // sale/purchase line items (Stock, Till, Western Power, etc.) — never actually empty.
        var client = await NewUserClientAsync("tax-sub-5");
        var tax = await CreateTaxAsync(client);

        var response = await client.GetAsync($"/api/taxes/{tax.Id}/transactions");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var transactions = await response.Content.ReadFromJsonAsync<List<TransactionDto>>();
        Assert.NotNull(transactions);
        Assert.Equal(14, transactions!.Count);
        Assert.Contains(transactions, t => t.Name == "Stock" && t.Type == 0);
        Assert.Contains(transactions, t => t.Name == "Western Power" && t.Type == 1);
    }

    [Fact]
    public async Task GetTransactionsByTaxId_ReturnsNotFound_WhenTaxOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("tax-sub-owner-2");
        var tax = await CreateTaxAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("tax-sub-stranger-2");

        var response = await strangerClient.GetAsync($"/api/taxes/{tax.Id}/transactions");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTransaction_ReturnsCreated_WithExplicitType()
    {
        var client = await NewUserClientAsync("tax-sub-6");
        var tax = await CreateTaxAsync(client);

        var response = await client.PostAsJsonAsync($"/api/taxes/{tax.Id}/transactions",
            new { taxId = tax.Id, name = "Bunnings Warehouse", amount = 220.00, gst = 20.00, type = 1 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var transaction = await response.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(transaction);
        Assert.Equal(tax.Id, transaction!.TaxId);
        Assert.Equal(1, transaction.Type);
    }

    [Fact]
    public async Task CreateTransaction_ReturnsCreated_WhenNameEmpty()
    {
        // GstTable's "Add row" button creates a blank starter row through this exact endpoint
        // (empty name, null amount/gst) for the user to fill in afterwards — this must keep
        // succeeding, not reject the blank name.
        var client = await NewUserClientAsync("tax-sub-7");
        var tax = await CreateTaxAsync(client);

        var response = await client.PostAsJsonAsync($"/api/taxes/{tax.Id}/transactions",
            new { taxId = tax.Id, name = "", amount = (double?)null, gst = (double?)null, type = 0 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateTransaction_ReturnsBadRequest_WhenAmountNegative()
    {
        var client = await NewUserClientAsync("tax-sub-8");
        var tax = await CreateTaxAsync(client);

        var response = await client.PostAsJsonAsync($"/api/taxes/{tax.Id}/transactions",
            new { taxId = tax.Id, name = "Refund", amount = -5.00, gst = 0.00, type = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTransaction_ReturnsNotFound_WhenTaxMissing()
    {
        var client = await NewUserClientAsync("tax-sub-9");

        var response = await client.PostAsJsonAsync("/api/taxes/999999/transactions",
            new { taxId = 999999, name = "Stock", amount = 10.00, gst = 1.00, type = 0 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTransaction_ReturnsNotFound_WhenTaxOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("tax-sub-owner-3");
        var tax = await CreateTaxAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("tax-sub-stranger-3");

        var response = await strangerClient.PostAsJsonAsync($"/api/taxes/{tax.Id}/transactions",
            new { taxId = tax.Id, name = "Stock", amount = 10.00, gst = 1.00, type = 0 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDates_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("tax-sub-10");
        var tax = await CreateTaxAsync(client);

        var response = await client.PatchAsync($"/api/taxes/{tax.Id}/update/dates",
            JsonContent.Create(new { dateStart = "2026-10-01", dateEnd = "2026-12-31" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDates_ReturnsBadRequest_WhenInvalidRange()
    {
        var client = await NewUserClientAsync("tax-sub-11");
        var tax = await CreateTaxAsync(client);

        var response = await client.PatchAsync($"/api/taxes/{tax.Id}/update/dates",
            JsonContent.Create(new { dateStart = "2026-12-31", dateEnd = "2026-10-01" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDates_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("tax-sub-12");

        var response = await client.PatchAsync("/api/taxes/999999/update/dates",
            JsonContent.Create(new { dateStart = "2026-07-01", dateEnd = "2026-09-30" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SendReport_ReturnsNotFound_WhenTaxMissing()
    {
        var client = await NewUserClientAsync("tax-sub-13");

        var response = await client.PostAsJsonAsync("/api/taxes/999999/send-report",
            new { recipientEmail = "accountant@example.com" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ScanTransaction_ReturnsBadRequest_WhenNoImageProvided()
    {
        var client = await NewUserClientAsync("tax-sub-14");
        var tax = await CreateTaxAsync(client);

        using var form = new MultipartFormDataContent();
        var response = await client.PostAsync($"/api/taxes/{tax.Id}/transactions/scan", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ScanTransaction_ReturnsBadRequest_WhenUnsupportedImageType()
    {
        var client = await NewUserClientAsync("tax-sub-15");
        var tax = await CreateTaxAsync(client);

        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent([1, 2, 3]);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        form.Add(fileContent, "image", "receipt.pdf");

        var response = await client.PostAsync($"/api/taxes/{tax.Id}/transactions/scan", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExists()
    {
        var client = await NewUserClientAsync("tax-sub-16");
        var tax = await CreateTaxAsync(client);

        var response = await client.DeleteAsync($"/api/taxes/{tax.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("tax-sub-17");

        var response = await client.DeleteAsync("/api/taxes/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AllEndpoints_ReturnUnauthorized_WhenNoToken()
    {
        var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/taxes/1")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.DeleteAsync("/api/taxes/1")).StatusCode);
    }
}
