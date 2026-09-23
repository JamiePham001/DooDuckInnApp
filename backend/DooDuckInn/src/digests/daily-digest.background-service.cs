namespace DooDuckInn.src.digests;

// ponytail: sleeps until the next Perth-local noon instead of polling — no job-scheduling
// framework needed for a single daily job. Recomputes the delay each iteration (rather than a
// fixed 24h interval) so any daylight saving changes don't drift the trigger time (Perth
// currently doesn't observe DST, but this stays correct if that ever changes).

// NOTE: this assumes an always-running host (fine for `dotnet run` / a container). If this ever
// deploys to AWS Lambda, a long-lived BackgroundService won't reliably fire between invocations —
// an EventBridge Scheduler rule invoking the Lambda directly at 12pm Perth time would be the
// correct mechanism there instead.
public class DailyDigestBackgroundService(IServiceScopeFactory scopeFactory, ILogger<DailyDigestBackgroundService> logger)
    : BackgroundService
{
    private static readonly TimeZoneInfo PerthTz = TimeZoneInfo.FindSystemTimeZoneById("Australia/Perth");

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeUntilNextPerthNoon(), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try { await RunIfDueAsync(); }
            catch (Exception ex) { logger.LogError(ex, "Daily digest run failed."); }
        }
    }

    private static TimeSpan TimeUntilNextPerthNoon()
    {
        var nowUtc = DateTime.UtcNow;
        var nowPerth = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, PerthTz);

        var nextNoonLocal = new DateTime(nowPerth.Year, nowPerth.Month, nowPerth.Day, 12, 0, 0, DateTimeKind.Unspecified);
        if (nextNoonLocal <= nowPerth) nextNoonLocal = nextNoonLocal.AddDays(1);

        var nextNoonUtc = TimeZoneInfo.ConvertTimeToUtc(nextNoonLocal, PerthTz);
        return nextNoonUtc - nowUtc;
    }

    private async Task RunIfDueAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var digests = scope.ServiceProvider.GetRequiredService<DigestsService>();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, PerthTz));
        if (await digests.HasRunTodayAsync(today)) return;

        var gmail = scope.ServiceProvider.GetRequiredService<GmailClient>();
        var agent = scope.ServiceProvider.GetRequiredService<DigestAgent>();

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
        await digests.SaveAsync(items);
        logger.LogInformation("Digest saved: {Count} items for {Date}", items.Count, today);
    }
}
