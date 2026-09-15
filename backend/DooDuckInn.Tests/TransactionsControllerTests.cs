using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

public class TransactionsControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<HttpClient> NewUserClientAsync(string sub)
    {
        var client = factory.CreateAuthedClient(sub);
        await client.PostAsync("/api/users", content: null);
        return client;
    }

    private static async Task<TransactionDto> CreateTransactionAsync(
        HttpClient client, string name = "Stock", double amount = 100.00, double gst = 10.00, int type = 0)
    {
        var taxResponse = await client.PostAsJsonAsync("/api/users/me/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });
        var tax = (await taxResponse.Content.ReadFromJsonAsync<TaxDto>())!;

        var transactionResponse = await client.PostAsJsonAsync($"/api/taxes/{tax.Id}/transactions",
            new { taxId = tax.Id, name, amount, gst, type });
        return (await transactionResponse.Content.ReadFromJsonAsync<TransactionDto>())!;
    }

    [Fact]
    public async Task GetById_ReturnsTransaction_WhenExists()
    {
        var client = await NewUserClientAsync("txn-sub-1");
        var transaction = await CreateTransactionAsync(client);

        var response = await client.GetAsync($"/api/transactions/{transaction.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("txn-sub-2");

        var response = await client.GetAsync("/api/transactions/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("txn-sub-owner-1");
        var transaction = await CreateTransactionAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("txn-sub-stranger-1");

        var response = await strangerClient.GetAsync($"/api/transactions/{transaction.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateInstance_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("txn-sub-3");
        var transaction = await CreateTransactionAsync(client);

        var response = await client.PatchAsync($"/api/transactions/{transaction.Id}/update",
            JsonContent.Create(new { name = "Updated Stock", amount = 150.00, gst = 15.00, type = 1 }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await (await client.GetAsync($"/api/transactions/{transaction.Id}"))
            .Content.ReadFromJsonAsync<TransactionDto>();
        Assert.Equal("Updated Stock", updated!.Name);
        Assert.Equal(150.00, updated.Amount);
        Assert.Equal(1, updated.Type);
    }

    [Fact]
    public async Task UpdateInstance_ReturnsNotFound_WhenAmountNegative()
    {
        var client = await NewUserClientAsync("txn-sub-4");
        var transaction = await CreateTransactionAsync(client);

        // Transaction.UpdateInstance throws ArgumentException for a negative amount, and
        // UpdateInstance's controller action maps ArgumentException to NotFound (not BadRequest) —
        // an existing quirk in that action, exercised here rather than silently assumed away.
        var response = await client.PatchAsync($"/api/transactions/{transaction.Id}/update",
            JsonContent.Create(new { name = "Bad", amount = -5.00, gst = 0.00, type = 0 }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateName_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("txn-sub-5");
        var transaction = await CreateTransactionAsync(client);

        var response = await client.PatchAsync($"/api/transactions/{transaction.Id}/update/name?name=Renamed", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAmount_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("txn-sub-6");
        var transaction = await CreateTransactionAsync(client);

        var response = await client.PatchAsync($"/api/transactions/{transaction.Id}/update/amount?amount=250.00", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateGst_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("txn-sub-7");
        var transaction = await CreateTransactionAsync(client);

        var response = await client.PatchAsync($"/api/transactions/{transaction.Id}/update/gst?gst=25.00", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateType_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("txn-sub-8");
        var transaction = await CreateTransactionAsync(client, type: 0);

        var response = await client.PatchAsync($"/api/transactions/{transaction.Id}/update/type?type=Purchase", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await (await client.GetAsync($"/api/transactions/{transaction.Id}"))
            .Content.ReadFromJsonAsync<TransactionDto>();
        Assert.Equal(1, updated!.Type);
    }

    [Fact]
    public async Task UpdateType_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("txn-sub-owner-2");
        var transaction = await CreateTransactionAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("txn-sub-stranger-2");

        var response = await strangerClient.PatchAsync(
            $"/api/transactions/{transaction.Id}/update/type?type=Purchase", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExists()
    {
        var client = await NewUserClientAsync("txn-sub-9");
        var transaction = await CreateTransactionAsync(client);

        var response = await client.DeleteAsync($"/api/transactions/{transaction.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("txn-sub-10");

        var response = await client.DeleteAsync("/api/transactions/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
