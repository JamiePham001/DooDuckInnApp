namespace DooDuckInn.src.users;

public sealed class User
{
    public int Id { get;}     // EF Core + Npgsql auto-configures this as IDENTITY
    public string CognitoSub {get;} = string.Empty;
    public string Email {get; private set;} = string.Empty;

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

}
