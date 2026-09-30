using Amazon.Lambda.Core;
using Anthropic.Core;
using Anthropic;
using DooDuckInn.src.db;
using DooDuckInn.src.digests;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace DooDuckInn.DigestScanFunction;

// Scheduled EventBridge Lambda function
// Since a scheduled EventBridge cant share the same pipeline as ASP.NET Core app as its invoke isnt HTTP-shaped
// and a plain lambda function written in a separate project is required
public class Function
{
    // Built once per Lambda instance (not inside FunctionHandler) so a warm invocation reuses the
    // same DI container and DB connection pool instead of paying startup cost on every call.
    private readonly IHost _host = Host.CreateDefaultBuilder()
        .ConfigureServices((context, services) =>
        {
            services.AddDbContext<AppDbContext>(options => options.UseNpgsql(context.Configuration["connectionString:DooDuckInn"]));
            services.AddSingleton(sp =>
                new AnthropicClient(new ClientOptions
                {
                    BaseUrl = "https://api.z.ai/api/anthropic",
                    ApiKey = sp.GetRequiredService<IConfiguration>()["Glm:ApiKey"] ?? "",
                }));
            services.AddScoped<DigestsService>();
            services.AddScoped<DigestAgent>();
            services.AddScoped<GmailClient>();
        })
        .Build();

    public async Task FunctionHandler(object _, ILambdaContext context)
    {
        // object _. An empty input payload. For the purposes of this function, special inputs arent required

        // A fresh scope per invocation, even though _host itself is shared across warm invocations —
        // DigestsService/AppDbContext are scoped, so reusing one scope across separate invocations
        // would leak state (e.g. a DbContext) between unrelated runs.
        using var scope = _host.Services.CreateScope();
        // retrieve digest services
        var digests = scope.ServiceProvider.GetRequiredService<DigestsService>();
        // get todays date based on Australia Perth time zone
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
            TimeZoneInfo.FindSystemTimeZoneById("Australia/Perth")));

        // check whether the email scan has already been ran within the same day
        if (!await digests.HasRunTodayAsync(today))
        {
            await digests.RunAsync(today);
        }
    }
}