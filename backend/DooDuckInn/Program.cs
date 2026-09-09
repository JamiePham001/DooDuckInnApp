using DooDuckInn.src.db;
using DooDuckInn.src.suppliers;
using Microsoft.EntityFrameworkCore;
using DooDuckInn.src.users;
using DooDuckInn.src.taxes;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
// Registers AppDbContext for dependency injection (that's why endpoints below can just take an
// `AppDbContext db` parameter and have it handed to them). UseInMemoryDatabase means nothing is
// actually persisted to Postgres yet — it's a fake in-process store for testing model behavior.
// Swap this one line for `.UseNpgsql(connectionString)` when you're ready to hit real Neon Postgres.
builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("DooDuckInn"));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddScoped<UsersService>();
builder.Services.AddScoped<TaxesService>();
builder.Services.AddScoped<SuppliersService>();

var app = builder.Build();

app.MapControllers();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();


app.Run();

