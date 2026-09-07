namespace DooDuckInn.Domain.GeneralServiceTaxes;

using DooDuckInn.Domain.Users;

public sealed class GeneralServiceTax
{
    public int Id { get; private set;}
    public int UserId {get; private set;}
    public User User { get; private set; } = default!;
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }

    public GeneralServiceTax(User user, DateOnly startDate, DateOnly endDate)
    {
        User = user ?? throw new Exception("User is required");
        UserId = user.Id;
        StartDate = startDate;
        EndDate = endDate;
    }
}
