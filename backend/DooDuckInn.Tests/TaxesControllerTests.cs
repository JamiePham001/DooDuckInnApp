using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

// Taxes drive the quarterly GST report, so this gets more edge-case coverage than the other
// controllers: invalid date ranges, boundary dates, and behavior for users with no tax records.
public class TaxesControllerTests(CustomWebApplicationFactory factory)
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
    public async Task CreateTax_ReturnsCreated_WithValidDates()
    {
        var userId = await CreateUserAsync("tax-sub-1");

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var tax = await response.Content.ReadFromJsonAsync<TaxDto>();
        Assert.NotNull(tax);
        Assert.Equal(userId, tax!.UserId);
    }

    [Fact]
    public async Task CreateTax_ReturnsNotFound_WhenUserMissing()
    {
        var response = await _client.PostAsJsonAsync("/api/users/999999/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTax_ReturnsBadRequest_WhenEndDateBeforeStartDate()
    {
        var userId = await CreateUserAsync("tax-sub-2");

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-09-30", dateEnd = "2026-07-01" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTax_ReturnsBadRequest_WhenEndDateEqualsStartDate()
    {
        var userId = await CreateUserAsync("tax-sub-3");

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-07-01" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsTax_WhenExists()
    {
        var userId = await CreateUserAsync("tax-sub-4");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });
        var tax = await created.Content.ReadFromJsonAsync<TaxDto>();

        var response = await _client.GetAsync($"/api/taxes/{tax!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.GetAsync("/api/taxes/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetByUserId_ReturnsEmptyList_WhenUserHasNoTaxes()
    {
        var userId = await CreateUserAsync("tax-sub-5");

        var response = await _client.GetAsync($"/api/users/{userId}/taxes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var taxes = await response.Content.ReadFromJsonAsync<List<TaxDto>>();
        Assert.NotNull(taxes);
        Assert.Empty(taxes!);
    }

    [Fact]
    public async Task GetByUserId_ReturnsNotFound_WhenUserMissing()
    {
        var response = await _client.GetAsync("/api/users/999999/taxes");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDates_ReturnsNoContent_WhenValid()
    {
        var userId = await CreateUserAsync("tax-sub-6");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });
        var tax = await created.Content.ReadFromJsonAsync<TaxDto>();

        var response = await _client.PatchAsync($"/api/taxes/{tax!.Id}/update/dates",
            JsonContent.Create(new { dateStart = "2026-10-01", dateEnd = "2026-12-31" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDates_ReturnsBadRequest_WhenInvalidRange()
    {
        var userId = await CreateUserAsync("tax-sub-7");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });
        var tax = await created.Content.ReadFromJsonAsync<TaxDto>();

        var response = await _client.PatchAsync($"/api/taxes/{tax!.Id}/update/dates",
            JsonContent.Create(new { dateStart = "2026-12-31", dateEnd = "2026-10-01" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDates_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.PatchAsync("/api/taxes/999999/update/dates",
            JsonContent.Create(new { dateStart = "2026-07-01", dateEnd = "2026-09-30" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExists()
    {
        var userId = await CreateUserAsync("tax-sub-8");
        var created = await _client.PostAsJsonAsync($"/api/users/{userId}/taxes",
            new { dateStart = "2026-07-01", dateEnd = "2026-09-30" });
        var tax = await created.Content.ReadFromJsonAsync<TaxDto>();

        var response = await _client.DeleteAsync($"/api/taxes/{tax!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.DeleteAsync("/api/taxes/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
