namespace DooDuckInn.src.taxes;

public sealed class Tax
{
    public int Id { get; private set;}
    public int UserId {get; private set;}
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }

    private Tax() { }  // for EF Core materialization

    public Tax(int userId, DateOnly startDate, DateOnly endDate)
    {
        ValidateDateRange(startDate, endDate);

        UserId = userId;
        StartDate = startDate;
        EndDate = endDate;
    }

    public void UpdateDates(DateOnly startDate, DateOnly endDate)
    {
        ValidateDateRange(startDate, endDate);

        StartDate = startDate;
        EndDate = endDate;
    }

    private static void ValidateDateRange(DateOnly startDate, DateOnly endDate)
    {
        if (endDate <= startDate)
        {
            throw new ArgumentException("EndDate must be after StartDate");
        }
    }
}
