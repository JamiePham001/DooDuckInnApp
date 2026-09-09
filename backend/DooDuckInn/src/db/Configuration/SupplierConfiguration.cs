using DooDuckInn.src.suppliers;
using DooDuckInn.src.users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DooDuckInn.src.db.Configuration;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.HasKey(s => s.Id);

        // Tax has no `User` navigation property, so the relationship is declared by type
        // instead of a lambda — HasOne<User>() rather than HasOne(t => t.User) — and
        // WithMany() with no argument since User has no collection navigation back either.
        builder
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(s => s.Name).HasMaxLength(150);

        builder.Property(s => s.Email).HasMaxLength(100);

        builder.Property(s => s.Phone).HasMaxLength(15);

    }
}
