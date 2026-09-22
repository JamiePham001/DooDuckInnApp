using System.Net;
using System.Net.Http.Json;
using DooDuckInn.src.db;
using DooDuckInn.src.digests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DooDuckInn.Tests;

// DigestItem carries no per-user ownership column (single mailbox, see the plan's reasoning),
// so unlike the other controller tests, rows aren't isolated by a unique sub — each test here
// gets its own CustomWebApplicationFactory (own InMemory database) instead of sharing one via
// IClassFixture, so seeded rows from one test can never leak into another.
public class DigestsControllerTests
{
    private static async Task SeedAsync(CustomWebApplicationFactory factory, params DigestItem[] items)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Digests.AddRange(items);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetLatest_ReturnsEmptyList_WhenNoDigestHasRun()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateAuthedClient("digest-sub-1");

        var response = await client.GetAsync("/api/digests/latest");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<DigestItemDto>>();
        Assert.Empty(items!);
    }

    [Fact]
    public async Task GetLatest_ReturnsOnlyTodaysItems_SortedByPriority()
    {
        using var factory = new CustomWebApplicationFactory();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);

        await SeedAsync(factory,
            new DigestItem(yesterday, "old-msg", "Old Sender", "old@example.com",
                "Old subject", "Old summary", DigestPriority.Critical, DateTimeOffset.UtcNow.AddDays(-1)),
            new DigestItem(today, "msg-low", "Newsletter Co", "news@example.com",
                "Weekly deals", "Promotional newsletter.", DigestPriority.Low, DateTimeOffset.UtcNow),
            new DigestItem(today, "msg-critical", "Supplier Co", "supplier@example.com",
                "Urgent: delivery delayed", "Delivery is delayed a week.", DigestPriority.Critical, DateTimeOffset.UtcNow));

        var client = factory.CreateAuthedClient("digest-sub-2");
        var response = await client.GetAsync("/api/digests/latest");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<DigestItemDto>>();
        Assert.Equal(2, items!.Count);
        Assert.DoesNotContain(items, i => i.GmailMessageId == "old-msg");
        Assert.Equal("msg-critical", items[0].GmailMessageId);
        Assert.Equal("msg-low", items[1].GmailMessageId);
    }

    [Fact]
    public async Task GetLatest_RequiresAuthentication()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/digests/latest");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Priority serializes as its underlying int (0=Critical..3=Low) — no JsonStringEnumConverter
    // is registered anywhere in this codebase, so this matches every other enum-bearing DTO.
    private record DigestItemDto(int Id, string GmailMessageId, string SenderName, string SenderEmail,
        string Subject, string Summary, int Priority, DateTimeOffset ReceivedAt);
}
