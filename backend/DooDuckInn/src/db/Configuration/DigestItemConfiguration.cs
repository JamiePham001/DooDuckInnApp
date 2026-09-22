using DooDuckInn.src.digests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DooDuckInn.src.db.Configuration;

public class DigestItemConfiguration : IEntityTypeConfiguration<DigestItem>
{
    public void Configure(EntityTypeBuilder<DigestItem> builder)
    {
        builder.HasKey(d => d.Id);

        // Dedupe guard: the background job checks HasRunTodayAsync before running, but this is
        // the DB-level backstop against ever inserting the same Gmail message twice.
        builder.HasIndex(d => d.GmailMessageId).IsUnique();

        builder.Property(d => d.GmailMessageId).HasMaxLength(150).IsRequired();
        builder.Property(d => d.SenderName).HasMaxLength(150).IsRequired();
        builder.Property(d => d.SenderEmail).HasMaxLength(150).IsRequired();
        builder.Property(d => d.Subject).HasMaxLength(300).IsRequired();
        builder.Property(d => d.Summary).HasMaxLength(500).IsRequired();

        // Enums map to their underlying int with no config needed, but C# won't stop a cast to
        // an out-of-range value — this constraint is the DB-level backstop, same reasoning as
        // the Transaction.Type and Item.Quantity checks.
        builder.ToTable(tb => tb.HasCheckConstraint(
            "CK_DigestItem_Priority_Valid",
            "\"Priority\" IN (0, 1, 2, 3)"));
    }
}
