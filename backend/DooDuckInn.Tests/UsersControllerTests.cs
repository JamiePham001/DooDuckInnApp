using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

public class UsersControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<(HttpClient Client, UserDto User)> CreateUserAsync(string sub)
    {
        var client = factory.CreateAuthedClient(sub);
        var response = await client.PostAsync("/api/users", content: null);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        return (client, user!);
    }

    [Fact]
    public async Task Create_ReturnsCreated_WhenAuthenticated()
    {
        var client = factory.CreateAuthedClient("user-sub-1");

        var response = await client.PostAsync("/api/users", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(user);
        Assert.Equal("user-sub-1", user!.CognitoSub);
    }

    [Fact]
    public async Task Create_ReturnsUnauthorized_WhenNoToken()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsync("/api/users", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_ReturnsUser_WhenExists()
    {
        var (client, user) = await CreateUserAsync("user-sub-2");

        var response = await client.GetAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal(user.Id, me!.Id);
    }

    [Fact]
    public async Task GetMe_ReturnsNotFound_WhenNoUserRowForSub()
    {
        var client = factory.CreateAuthedClient("user-sub-never-registered");

        var response = await client.GetAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenNoToken()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateEmail_ReturnsNoContent_WhenExists()
    {
        var (client, _) = await CreateUserAsync("user-sub-3");

        var response = await client.PatchAsync("/api/users/me/email",
            JsonContent.Create(new { email = "dad@example.com" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var me = await (await client.GetAsync("/api/users/me")).Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal("dad@example.com", me!.Email);
    }

    [Fact]
    public async Task GetMyTaxes_ReturnsEmptyList_WhenNoTaxes()
    {
        var (client, _) = await CreateUserAsync("user-sub-4");

        var response = await client.GetAsync("/api/users/me/taxes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var taxes = await response.Content.ReadFromJsonAsync<List<TaxDto>>();
        Assert.NotNull(taxes);
        Assert.Empty(taxes!);
    }

    [Fact]
    public async Task GetMySuppliers_ReturnsEmptyList_WhenNoSuppliers()
    {
        var (client, _) = await CreateUserAsync("user-sub-5");

        var response = await client.GetAsync("/api/users/me/suppliers");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var suppliers = await response.Content.ReadFromJsonAsync<List<SupplierDto>>();
        Assert.NotNull(suppliers);
        Assert.Empty(suppliers!);
    }

    [Fact]
    public async Task CreateTax_ReturnsCreated_WithValidDates()
    {
        var (client, user) = await CreateUserAsync("user-sub-6");

        var response = await client.PostAsJsonAsync("/api/users/me/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var tax = await response.Content.ReadFromJsonAsync<TaxDto>();
        Assert.NotNull(tax);
        Assert.Equal(user.Id, tax!.UserId);
    }

    [Fact]
    public async Task CreateSupplier_ReturnsCreated_WithValidData()
    {
        var (client, user) = await CreateUserAsync("user-sub-7");

        var response = await client.PostAsJsonAsync("/api/users/me/suppliers",
            new { name = "Acme Produce", email = "orders@acme.test", phone = "0400000000" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var supplier = await response.Content.ReadFromJsonAsync<SupplierDto>();
        Assert.NotNull(supplier);
        Assert.Equal(user.Id, supplier!.UserId);
    }
}
