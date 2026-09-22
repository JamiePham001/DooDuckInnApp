using DooDuckInn.src.db;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.digests;

public class DigestsService(AppDbContext db)
{
    public async Task<List<DigestItem>> GetLatestAsync()
    {
        var latestRunDate = await db.Digests.MaxAsync(d => (DateOnly?)d.RunDate);
        if (latestRunDate is null) return [];

        return await db.Digests
            .Where(d => d.RunDate == latestRunDate)
            .OrderBy(d => d.Priority).ThenByDescending(d => d.ReceivedAt)
            .ToListAsync();
    }

    public Task<bool> HasRunTodayAsync(DateOnly today) =>
        db.Digests.AnyAsync(d => d.RunDate == today);

    public async Task SaveAsync(IEnumerable<DigestItem> items)
    {
        db.Digests.AddRange(items);
        await db.SaveChangesAsync();
    }
}
