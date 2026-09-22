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
}
