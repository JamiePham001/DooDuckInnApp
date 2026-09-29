namespace DooDuckInn.src.users;

public sealed class User
{
    // Cost-control, not security — the receipt scan calls GLM per request, so this caps runaway
    // spend from a bug/loop rather than guarding against abuse (the app has exactly one user).
    private const int MaxDailyScans = 15;

    public int Id { get; }     // EF Core + Npgsql auto-configures this as IDENTITY
    public string CognitoSub { get; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public int ScanCount { get; private set; }
    public DateOnly? LastScanDate { get; private set; }

    private User() { }  // for EF Core materialization

    public User(string cognitosub)
    {
        if (string.IsNullOrEmpty(cognitosub))
        {
            throw new ArgumentException("CognitoSub is required");
        }

        CognitoSub = cognitosub;

    }

    public void UpdateEmail(string email)
    {
        // add input checks for email and abn
        Email = email;
    }

    // Resets the count on a new day, then checks/consumes one unit of quota. Returns false
    // (without mutating ScanCount) if today's limit is already used up.
    public bool TryRegisterScan(DateOnly today)
    {
        if (LastScanDate != today)
        {
            LastScanDate = today;
            ScanCount = 0;
        }

        if (ScanCount >= MaxDailyScans) return false;

        ScanCount++;
        return true;
    }

}
