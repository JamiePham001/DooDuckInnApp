using DooDuckInn.src.taxes;
using DooDuckInn.src.users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DooDuckInn.src.db.Configuration;

public class TaxConfiguration : IEntityTypeConfiguration<Tax>
{
    public void Configure(EntityTypeBuilder<Tax> builder)
    {
        builder.HasKey(t => t.Id);

        // Tax has no `User` navigation property, so the relationship is declared by type
        // instead of a lambda — HasOne<User>() rather than HasOne(t => t.User) — and
        // WithMany() with no argument since User has no collection navigation back either.
        builder
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Stops the same user getting two identical GST periods (double-submit protection).
        builder.HasIndex(t => new { t.UserId, t.StartDate, t.EndDate })
            .IsUnique();

        // Postgres rejects any row where EndDate <= StartDate.
        builder.ToTable(tb => tb.HasCheckConstraint(
            "CK_Tax_EndDate_After_StartDate",
            "\"EndDate\" > \"StartDate\""));
    }
}
