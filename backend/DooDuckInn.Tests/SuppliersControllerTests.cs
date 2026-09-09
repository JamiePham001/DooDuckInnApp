using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

// Suppliers drive the stock-ordering-by-email feature, so creation gets extra coverage on the
// required fields (name/email) alongside the standard not-found paths.
public class SuppliersControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<int> CreateUserAsync(string cognitoSub)
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { cognitoSub });
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        return user!.Id;
    }

    [Fact]
    public async Task CreateSupplier_ReturnsCreated_WithValidData()
    {
        var userId = await CreateUserAsync("supplier-sub-1");

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var supplier = await response.Content.ReadFromJsonAsync<SupplierDto>();
        Assert.NotNull(supplier);
        Assert.Equal(userId, supplier!.UserId);
    }

    [Fact]
    public async Task CreateSupplier_ReturnsNotFound_WhenUserMissing()
    {
        var response = await _client.PostAsJsonAsync("/api/users/999999/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateSupplier_ReturnsBadRequest_WhenNameEmpty()
    {
        var userId = await CreateUserAsync("supplier-sub-2");

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "", email = "orders@acme.test", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSupplier_ReturnsBadRequest_WhenEmailEmpty()
    {
        var userId = await CreateUserAsync("supplier-sub-3");

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "Acme Produce", email = "", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsSupplier_WhenExists()
    {
        var userId = await CreateUserAsync("supplier-sub-4");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });
        var supplier = await created.Content.ReadFromJsonAsync<SupplierDto>();

        var response = await _client.GetAsync($"/api/suppliers/{supplier!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.GetAsync("/api/suppliers/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetByUserId_ReturnsEmptyList_WhenUserHasNoSuppliers()
    {
        var userId = await CreateUserAsync("supplier-sub-5");

        var response = await _client.GetAsync($"/api/users/{userId}/suppliers");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var suppliers = await response.Content.ReadFromJsonAsync<List<SupplierDto>>();
        Assert.NotNull(suppliers);
        Assert.Empty(suppliers!);
    }

    [Fact]
    public async Task GetByUserId_ReturnsNotFound_WhenUserMissing()
    {
        var response = await _client.GetAsync("/api/users/999999/suppliers");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDetails_ReturnsNoContent_WhenValid()
    {
        var userId = await CreateUserAsync("supplier-sub-6");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });
        var supplier = await created.Content.ReadFromJsonAsync<SupplierDto>();

        var response = await _client.PatchAsync($"/api/suppliers/{supplier!.Id}/update/details",
            JsonContent.Create(new { name = "Acme Produce Co", email = "orders@acme.test", phone = "0400000000" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDetails_KeepsExistingValue_WhenFieldEmpty()
    {
        var userId = await CreateUserAsync("supplier-sub-7");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });
        var supplier = await created.Content.ReadFromJsonAsync<SupplierDto>();

        // Empty name/phone means "leave unchanged" per UpdateDetails' partial-update semantics.
        await _client.PatchAsync($"/api/suppliers/{supplier!.Id}/update/details",
            JsonContent.Create(new { name = "", email = "new@acme.test", phone = "" }));

        var response = await _client.GetAsync($"/api/suppliers/{supplier.Id}");
        var updated = await response.Content.ReadFromJsonAsync<SupplierDto>();

        Assert.Equal("Acme Produce", updated!.Name);
        Assert.Equal("new@acme.test", updated.Email);
        Assert.Equal("0400000000", updated.Phone);
    }

    [Fact]
    public async Task UpdateDetails_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.PatchAsync("/api/suppliers/999999/update/details",
            JsonContent.Create(new { name = "Acme", email = "orders@acme.test", phone = "0400000000" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExists()
    {
        var userId = await CreateUserAsync("supplier-sub-8");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });
        var supplier = await created.Content.ReadFromJsonAsync<SupplierDto>();

        var response = await _client.DeleteAsync($"/api/suppliers/{supplier!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.DeleteAsync("/api/suppliers/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
