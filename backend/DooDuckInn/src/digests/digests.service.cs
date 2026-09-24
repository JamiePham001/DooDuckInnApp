using DooDuckInn.src.db;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.digests;

public class DigestsService(AppDbContext db, GmailClient gmail, DigestAgent agent, ILogger<DigestsService> logger)
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

    // Shared by DailyDigestBackgroundService's scheduled run and DigestsController's manual
    // "run now" endpoint — fetches, summarizes, and saves today's digest. Returns what was saved.
    public async Task<List<DigestItem>> RunAsync(DateOnly today)
    {
        var emails = await gmail.FetchRecentAsync();
        var items = new List<DigestItem>();
        foreach (var email in emails)
        {
            try
            {
                var (priority, summary) = await agent.SummarizeAsync(email.SenderName, email.Subject, email.Snippet);
                items.Add(new DigestItem(today, email.MessageId, email.SenderName, email.SenderEmail,
                    email.Subject, summary, priority, email.ReceivedAt));
            }
            catch (DigestAgentException ex) { logger.LogWarning(ex, "Skipped one email in digest."); }
        }
        await SaveAsync(items);
        logger.LogInformation("Digest saved: {Count} items for {Date}", items.Count, today);
        return items;
    }
}
