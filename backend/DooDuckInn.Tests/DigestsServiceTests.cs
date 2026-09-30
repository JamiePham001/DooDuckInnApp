using DooDuckInn.src.db;
using DooDuckInn.src.digests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DooDuckInn.Tests;

// DigestItem carries no per-user ownership column (single mailbox), so — like
// DigestsControllerTests — each test gets its own CustomWebApplicationFactory
// (own InMemory database) rather than sharing one.
public class DigestsServiceTests
{
    private static async Task SeedAsync(CustomWebApplicationFactory factory, params DigestItem[] items)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Digests.AddRange(items);
        await db.SaveChangesAsync();
    }

    private static DigestItem MakeItem(DateOnly runDate, string messageId) =>
        new(runDate, messageId, "Supplier Co", "supplier@example.com",
            "Order confirmation", "Order summary.", DigestPriority.Low, DateTimeOffset.UtcNow);

    [Fact]
    public async Task DeleteOldEmailsAsync_RemovesOnlyItemsBeforeToday()
    {
        using var factory = new CustomWebApplicationFactory();
        var today = new DateOnly(2026, 9, 30);
        var yesterday = today.AddDays(-1);

        await SeedAsync(factory,
            MakeItem(yesterday, "old-msg"),
            MakeItem(today, "todays-msg"));

        using var scope = factory.Services.CreateScope();
        var digests = scope.ServiceProvider.GetRequiredService<DigestsService>();

        var deletedCount = await digests.DeleteOldEmailsAsync(today);

        Assert.Equal(1, deletedCount);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var remaining = await db.Digests.ToListAsync();
        Assert.Single(remaining);
        Assert.Equal("todays-msg", remaining[0].GmailMessageId);
    }

    [Fact]
    public async Task DeleteOldEmailsAsync_ReturnsZero_WhenNothingIsOld()
    {
        using var factory = new CustomWebApplicationFactory();
        var today = new DateOnly(2026, 9, 30);

        await SeedAsync(factory, MakeItem(today, "todays-msg"));

        using var scope = factory.Services.CreateScope();
        var digests = scope.ServiceProvider.GetRequiredService<DigestsService>();

        var deletedCount = await digests.DeleteOldEmailsAsync(today);

        Assert.Equal(0, deletedCount);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(1, await db.Digests.CountAsync());
    }

    [Fact]
    public async Task DeleteOldEmailsAsync_DoesNothing_WhenTableIsEmpty()
    {
        using var factory = new CustomWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var digests = scope.ServiceProvider.GetRequiredService<DigestsService>();

        var deletedCount = await digests.DeleteOldEmailsAsync(new DateOnly(2026, 9, 30));

        Assert.Equal(0, deletedCount);
    }
}
