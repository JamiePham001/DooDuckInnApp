using DooDuckInn.src.db;
using DooDuckInn.src.suppliers;
using Microsoft.EntityFrameworkCore;
using DooDuckInn.src.users;
using DooDuckInn.src.taxes;
using DooDuckInn.src.items;
using DooDuckInn.src.transactions;
using DooDuckInn.src.email;
using DooDuckInn.src.digests;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Anthropic;
using Anthropic.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Cognito:Authority"];
        // JwtBearerHandler remaps standard JWT claim names to legacy .NET ClaimTypes URIs
        // by default (e.g. "sub" -> ClaimTypes.NameIdentifier) — CurrentUserAsync() reads
        // the raw "sub" claim name, so that remapping has to be disabled here or every
        // request 500s inside a supposedly-successful auth.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Cognito:ClientId"],
        };
    });
builder.Services.AddAuthorization();

// Points the Anthropic SDK at Z.ai's Anthropic-compatible endpoint instead of Anthropic's own —
// it mirrors the Messages API wire format exactly, so TransactionAgent needs zero code changes,
// just a different base URL and API key. Swap BaseUrl back (and the config key) to move back to
// real Claude models later.
builder.Services.AddSingleton(sp =>
    new AnthropicClient(new ClientOptions
    {
        BaseUrl = "https://api.z.ai/api/anthropic",
        ApiKey = sp.GetRequiredService<IConfiguration>()["Glm:ApiKey"] ?? "",
    }));
builder.Services.AddScoped<TransactionAgent>();

// Registers AppDbContext for dependency injection (that's why endpoints below can just take an
// `AppDbContext db` parameter and have it handed to them). Skipped under the "Testing" environment
// so CustomWebApplicationFactory can register InMemory instead — registering Npgsql here first
// makes EF Core see two database providers in the same service provider and throw.
// Set locally via `dotnet user-secrets set ConnectionStrings:DooDuckInn "..."` (see .env.local for the Neon URL).
if (!builder.Environment.IsEnvironment("Testing"))
{
    var connectionString = builder.Configuration["ConnectionString:DooDuckInn"];
    builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
}

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

QuestPDF.Settings.License = LicenseType.Professional;

builder.Services.AddScoped<UsersService>();
builder.Services.AddScoped<TaxesService>();
builder.Services.AddScoped<SuppliersService>();
builder.Services.AddScoped<ItemsService>();
builder.Services.AddScoped<TransactionsService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<DigestsService>();
builder.Services.AddScoped<DigestAgent>();
builder.Services.AddScoped<GmailClient>();
builder.Services.AddHostedService<DailyDigestBackgroundService>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();


app.Run();

