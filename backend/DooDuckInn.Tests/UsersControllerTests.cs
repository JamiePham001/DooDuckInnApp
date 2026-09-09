using System.Net;
using System.Net.Http.Json;

namespace DooDuckInn.Tests;

public class UsersControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_ReturnsCreated_WithValidCognitoSub()
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { cognitoSub = "sub-1" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(user);
        Assert.Equal("sub-1", user!.CognitoSub);
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenCognitoSubEmpty()
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { cognitoSub = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsUser_WhenExists()
    {
        var created = await _client.PostAsJsonAsync("/api/users", new { cognitoSub = "sub-2" });
        var user = await created.Content.ReadFromJsonAsync<UserDto>();

        var response = await _client.GetAsync($"/api/users/{user!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.GetAsync("/api/users/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateEmail_ReturnsNoContent_WhenExists()
    {
        var created = await _client.PostAsJsonAsync("/api/users", new { cognitoSub = "sub-3" });
        var user = await created.Content.ReadFromJsonAsync<UserDto>();

        var response = await _client.PatchAsync($"/api/users/{user!.Id}/email",
            JsonContent.Create(new { email = "dad@example.com" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateEmail_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.PatchAsync("/api/users/999999/email",
            JsonContent.Create(new { email = "dad@example.com" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
