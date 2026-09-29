using DooDuckInn.src.users;

namespace DooDuckInn.Tests;

// Pure domain-logic tests for the daily scan quota — no network, no DB needed.
public class UserModelTests
{
    private static readonly DateOnly Today = new(2026, 9, 29);
    private static readonly DateOnly Tomorrow = Today.AddDays(1);

    [Fact]
    public void TryRegisterScan_AllowsUpToTheDailyLimit()
    {
        var user = new User("sub-1");

        for (var i = 0; i < 50; i++)
            Assert.True(user.TryRegisterScan(Today));
    }

    [Fact]
    public void TryRegisterScan_RejectsOnceLimitReached()
    {
        var user = new User("sub-2");
        for (var i = 0; i < 50; i++) user.TryRegisterScan(Today);

        Assert.False(user.TryRegisterScan(Today));
    }

    [Fact]
    public void TryRegisterScan_ResetsOnANewDay()
    {
        var user = new User("sub-3");
        for (var i = 0; i < 50; i++) user.TryRegisterScan(Today);
        Assert.False(user.TryRegisterScan(Today));

        Assert.True(user.TryRegisterScan(Tomorrow));
    }
}
