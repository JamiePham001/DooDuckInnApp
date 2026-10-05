namespace DooDuckInn.src.digests;

public enum DigestPriority { Critical, High, Medium, Low }

public class DigestItem
{
    public int Id { get; }
    public DateOnly RunDate { get; private set; }
    public string GmailMessageId { get; private set; } = default!;
    public string SenderName { get; private set; } = default!;
    public string SenderEmail { get; private set; } = default!;
    public string Subject { get; private set; } = default!;
    public string Summary { get; private set; } = default!;
    public DigestPriority Priority { get; private set; }
    public DateTimeOffset ReceivedAt { get; private set; }

    public DigestItem(DateOnly runDate, string gmailMessageId, string senderName, string senderEmail,
        string subject, string summary, DigestPriority priority, DateTimeOffset receivedAt)
    {
        RunDate = runDate;
        GmailMessageId = gmailMessageId;
        SenderName = senderName;
        SenderEmail = senderEmail;
        Subject = subject;
        Summary = summary;
        Priority = priority;
        ReceivedAt = receivedAt;
    }

    // Called when a still-inboxed email reappears in a later run instead of being
    // re-summarized: keeps it counted as part of today's digest so DeleteOldEmailsAsync
    // doesn't sweep it up as stale, without paying for another Claude call.
    public void CarryForward(DateOnly today) => RunDate = today;
}
