using DooDuckInn.src.suppliers;
using DooDuckInn.src.items;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DooDuckInn.src.db.Configuration;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.HasKey(i => i.Id);

        // Tax has no `User` navigation property, so the relationship is declared by type
        // instead of a lambda — HasOne<User>() rather than HasOne(t => t.User) — and
        // WithMany() with no argument since User has no collection navigation back either.
        builder
            .HasOne<Supplier>()
            .WithMany()
            .HasForeignKey(i => i.SupplierId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(i => i.Name).HasMaxLength(150).IsRequired();

        builder.Property(i => i.Quantity).HasDefaultValue(0);

        // Backs up UpdateQuantity's app-level check — InMemoryDatabase won't enforce this, but
        // Postgres will if something ever bypasses the model (a raw update, a migration, etc.).
        builder.ToTable(tb => tb.HasCheckConstraint(
            "CK_Item_Quantity_NonNegative",
            "\"Quantity\" >= 0"));
    }
}
