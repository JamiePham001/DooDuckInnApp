using DooDuckInn.src.transactions;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DooDuckInn.src.db.Configuration;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(t => t.Id);
        builder
            .HasOne<Tax>()
            .WithMany()
            .HasForeignKey(t => t.TaxId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(t => t.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder
            .Property(t => t.Amount)
            .HasDefaultValue(0.00);

        builder
            .Property(t => t.Gst);

        // Enums map to their underlying int with no config needed, but C# won't stop a cast to
        // an out-of-range value (e.g. (TransactionType)5) — this constraint is the DB-level
        // backstop, same reasoning as the Tax date-range and Item quantity checks.
        builder.ToTable(tb => tb.HasCheckConstraint(
            "CK_Transaction_Type_Valid",
            "\"Type\" IN (0, 1)"));
    }
}
