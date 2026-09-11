using DooDuckInn.src.db;
using DooDuckInn.src.suppliers;
using Microsoft.EntityFrameworkCore;
using DooDuckInn.src.users;
using DooDuckInn.src.taxes;
using DooDuckInn.src.items;
using DooDuckInn.src.transactions;
using DooDuckInn.src.email;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Cognito:Authority"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Cognito:ClientId"],
        };
    });
builder.Services.AddAuthorization();
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

