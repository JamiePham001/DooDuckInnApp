using DooDuckInn.src.db;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DooDuckInn.Tests;

// Runs the host under the "Testing" environment, which Program.cs checks to skip its own
// Npgsql registration (registering both providers in one service provider makes EF Core throw),
// then registers a fresh, uniquely-named InMemory database per factory instance so each test
// class runs against its own isolated store instead of sharing state.
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_dbName));
        });
    }
}
