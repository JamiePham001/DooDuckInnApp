using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

public class ItemsControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<HttpClient> NewUserClientAsync(string sub)
    {
        var client = factory.CreateAuthedClient(sub);
        await client.PostAsync("/api/users", content: null);
        return client;
    }

    private static async Task<ItemDto> CreateItemAsync(HttpClient client, string name = "Chopsticks")
    {
        var supplierResponse = await client.PostAsJsonAsync("/api/users/me/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });
        var supplier = (await supplierResponse.Content.ReadFromJsonAsync<SupplierDto>())!;

        var itemResponse = await client.PostAsJsonAsync($"/api/suppliers/{supplier.Id}/item", new { name });
        return (await itemResponse.Content.ReadFromJsonAsync<ItemDto>())!;
    }

    [Fact]
    public async Task GetById_ReturnsItem_WhenExists()
    {
        var client = await NewUserClientAsync("item-sub-1");
        var item = await CreateItemAsync(client);

        var response = await client.GetAsync($"/api/items/{item.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("item-sub-2");

        var response = await client.GetAsync("/api/items/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("item-sub-owner-1");
        var item = await CreateItemAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("item-sub-stranger-1");

        var response = await strangerClient.GetAsync($"/api/items/{item.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateName_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("item-sub-3");
        var item = await CreateItemAsync(client);

        var response = await client.PatchAsync($"/api/items/{item.Id}/update/name?name=Forks", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateName_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("item-sub-4");

        var response = await client.PatchAsync("/api/items/999999/update/name?name=Forks", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateQuantity_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("item-sub-5");
        var item = await CreateItemAsync(client);

        var response = await client.PatchAsync($"/api/items/{item.Id}/update/quantity?qty=50", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await client.GetAsync($"/api/items/{item.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<ItemDto>();
        Assert.Equal(50, updated!.Quantity);
    }

    [Fact]
    public async Task UpdateQuantity_ReturnsNoContent_AndClearsValue_WhenOmitted()
    {
        var client = await NewUserClientAsync("item-sub-8");
        var item = await CreateItemAsync(client);
        await client.PatchAsync($"/api/items/{item.Id}/update/quantity?qty=50", null);

        // No `qty` query param at all — this is what the frontend now sends while the
        // user has cleared the cell, rather than coercing the blank input back to 0.
        var response = await client.PatchAsync($"/api/items/{item.Id}/update/quantity", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await client.GetAsync($"/api/items/{item.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<ItemDto>();
        Assert.Null(updated!.Quantity);
    }

    [Fact]
    public async Task UpdateQuantity_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("item-sub-owner-2");
        var item = await CreateItemAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("item-sub-stranger-2");

        var response = await strangerClient.PatchAsync($"/api/items/{item.Id}/update/quantity?qty=99", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExists()
    {
        var client = await NewUserClientAsync("item-sub-6");
        var item = await CreateItemAsync(client);

        var response = await client.DeleteAsync($"/api/items/{item.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("item-sub-7");

        var response = await client.DeleteAsync("/api/items/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
