using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

// Suppliers drive the stock-ordering-by-email feature, so creation gets extra coverage on the
// required fields (name/email) alongside the standard not-found and ownership-isolation paths.
// send-order is only tested on its pre-email-send failure path (missing supplier) — the happy
// path would fire a real SES call, which tests must never do.
public class SuppliersControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<HttpClient> NewUserClientAsync(string sub)
    {
        var client = factory.CreateAuthedClient(sub);
        await client.PostAsync("/api/users", content: null);
        return client;
    }

    private static async Task<SupplierDto> CreateSupplierAsync(HttpClient client, string name = "Acme Produce")
    {
        var response = await client.PostAsJsonAsync("/api/users/me/suppliers",
            new { name, email = "orders@acme.test", phone = "0400000000" });
        return (await response.Content.ReadFromJsonAsync<SupplierDto>())!;
    }

    [Fact]
    public async Task CreateSupplier_ReturnsBadRequest_WhenNameEmpty()
    {
        var client = await NewUserClientAsync("supplier-sub-1");

        var response = await client.PostAsJsonAsync("/api/users/me/suppliers",
            new { name = "", email = "orders@acme.test", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSupplier_ReturnsBadRequest_WhenEmailEmpty()
    {
        var client = await NewUserClientAsync("supplier-sub-2");

        var response = await client.PostAsJsonAsync("/api/users/me/suppliers",
            new { name = "Acme Produce", email = "", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsSupplier_WhenExists()
    {
        var client = await NewUserClientAsync("supplier-sub-3");
        var supplier = await CreateSupplierAsync(client);

        var response = await client.GetAsync($"/api/suppliers/{supplier.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("supplier-sub-4");

        var response = await client.GetAsync("/api/suppliers/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("supplier-sub-owner-1");
        var supplier = await CreateSupplierAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("supplier-sub-stranger-1");

        var response = await strangerClient.GetAsync($"/api/suppliers/{supplier.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDetails_ReturnsNoContent_WhenValid()
    {
        var client = await NewUserClientAsync("supplier-sub-5");
        var supplier = await CreateSupplierAsync(client);

        var response = await client.PatchAsync($"/api/suppliers/{supplier.Id}/update/details",
            JsonContent.Create(new { name = "Acme Produce Co", email = "orders@acme.test", phone = "0400000000" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDetails_KeepsExistingValue_WhenFieldEmpty()
    {
        var client = await NewUserClientAsync("supplier-sub-6");
        var supplier = await CreateSupplierAsync(client);

        // Empty name/phone means "leave unchanged" per UpdateDetails' partial-update semantics.
        await client.PatchAsync($"/api/suppliers/{supplier.Id}/update/details",
            JsonContent.Create(new { name = "", email = "new@acme.test", phone = "" }));

        var response = await client.GetAsync($"/api/suppliers/{supplier.Id}");
        var updated = await response.Content.ReadFromJsonAsync<SupplierDto>();

        Assert.Equal("Acme Produce", updated!.Name);
        Assert.Equal("new@acme.test", updated.Email);
        Assert.Equal("0400000000", updated.Phone);
    }

    [Fact]
    public async Task UpdateDetails_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("supplier-sub-7");

        var response = await client.PatchAsync("/api/suppliers/999999/update/details",
            JsonContent.Create(new { name = "Acme", email = "orders@acme.test", phone = "0400000000" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDetails_ReturnsNotFound_WhenOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("supplier-sub-owner-2");
        var supplier = await CreateSupplierAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("supplier-sub-stranger-2");

        var response = await strangerClient.PatchAsync($"/api/suppliers/{supplier.Id}/update/details",
            JsonContent.Create(new { name = "Hijacked", email = "orders@acme.test", phone = "0400000000" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateItem_ReturnsCreated_WithValidData()
    {
        var client = await NewUserClientAsync("supplier-sub-8");
        var supplier = await CreateSupplierAsync(client);

        var response = await client.PostAsJsonAsync($"/api/suppliers/{supplier.Id}/item", new { name = "Chopsticks" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<ItemDto>();
        Assert.NotNull(item);
        Assert.Equal(supplier.Id, item!.SupplierId);
    }

    [Fact]
    public async Task CreateItem_ReturnsNotFound_WhenSupplierOwnedByAnotherUser()
    {
        var ownerClient = await NewUserClientAsync("supplier-sub-owner-3");
        var supplier = await CreateSupplierAsync(ownerClient);
        var strangerClient = await NewUserClientAsync("supplier-sub-stranger-3");

        var response = await strangerClient.PostAsJsonAsync($"/api/suppliers/{supplier.Id}/item", new { name = "Chopsticks" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SendOrder_ReturnsNotFound_WhenSupplierMissing()
    {
        var client = await NewUserClientAsync("supplier-sub-9");

        var response = await client.PostAsJsonAsync("/api/suppliers/999999/send-order",
            new { recipientEmail = "supplier@example.com", date = "2026-10-01" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExists()
    {
        var client = await NewUserClientAsync("supplier-sub-10");
        var supplier = await CreateSupplierAsync(client);

        var response = await client.DeleteAsync($"/api/suppliers/{supplier.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        var client = await NewUserClientAsync("supplier-sub-11");

        var response = await client.DeleteAsync("/api/suppliers/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
