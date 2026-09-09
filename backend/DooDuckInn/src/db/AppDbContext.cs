using Microsoft.EntityFrameworkCore;
using DooDuckInn.src.users;
using DooDuckInn.src.suppliers;
using DooDuckInn.src.taxes;

namespace DooDuckInn.src.db;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Each DbSet<T> is the entry point for querying/adding that entity type, e.g. db.Users.Add(...).
    // Set<User>() looks up (or creates) EF's internal tracking set for that type.
    public DbSet<User> Users => Set<User>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Tax> Taxes => Set<Tax>();

    // Scans this assembly for every IEntityTypeConfiguration<T> (UserConfiguration, and any
    // SupplierConfiguration/TaxConfiguration added later) and applies them automatically.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}