using DooDuckInn.src.db;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DooDuckInn.Tests;

// Runs the host under the "Testing" environment, which Program.cs checks to skip its own
// Npgsql registration (registering both providers in one service provider makes EF Core throw),
// then registers a fresh, uniquely-named InMemory database per factory instance so each test
// class runs against its own isolated store instead of sharing state. Also swaps real Cognito
// JWT validation for TestAuthHandler, since there's no way to mint a real Cognito token in tests.
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_dbName));

            services.AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

            // Program.cs's AddAuthentication(JwtBearerDefaults.AuthenticationScheme) already ran and
            // set these — PostConfigure runs after every Configure call regardless of order, so this
            // reliably wins and makes [Authorize] resolve to TestAuthHandler instead of real JWT auth.
            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultScheme = TestAuthHandler.SchemeName;
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            });
        });
    }

    // A client authenticated as the given Cognito sub — every [Authorize] endpoint reads this
    // back out via User.FindFirst("sub"), same as it would from a real validated JWT's claims.
    public HttpClient CreateAuthedClient(string sub)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.SubHeader, sub);
        return client;
    }
}
