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

        // FetchRecentAsync returns the inbox's most recent messages regardless of what's
        // already been digested, so on a day with few new emails it re-returns ones already
        // saved from an earlier run. GmailMessageId is globally unique (see
        // DigestItemConfiguration), so inserting one again would throw - skip re-summarizing
        // and re-inserting them, but carry their RunDate forward to today. Without that,
        // they'd keep yesterday's RunDate, DeleteOldEmailsAsync would delete them right after
        // this method returns (its "< today" sweep), and - since the inbox hasn't changed -
        // they'd just get treated as brand new and re-summarized on the next run anyway.
        var fetchedIds = emails.Select(e => e.MessageId).ToList();
        var alreadySaved = await db.Digests
            .Where(d => fetchedIds.Contains(d.GmailMessageId))
            .ToListAsync();
        foreach (var existing in alreadySaved) existing.CarryForward(today);

        var alreadySavedIds = alreadySaved.Select(d => d.GmailMessageId).ToHashSet();
        var newEmails = emails.Where(e => !alreadySavedIds.Contains(e.MessageId)).ToList();

        var items = new List<DigestItem>();
        foreach (var email in newEmails)
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

    public async Task<int> DeleteOldEmailsAsync(DateOnly today)
    {
        var items = await db.Digests.Where(d => d.RunDate < today).ToListAsync();
        db.Digests.RemoveRange(items);
        await db.SaveChangesAsync();
        return items.Count;
    }
}
