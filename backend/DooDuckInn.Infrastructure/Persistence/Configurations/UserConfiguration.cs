using DooDuckInn.Domain.GeneralServiceTaxes;
using DooDuckInn.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace DooDuckInn.Infrastructure.Persistence.Configurations;

public class UserConfiguration  : IEntityTypeConfiguration<User>
{
        public void Configure(EntityTypeBuilder<User> builder)
    {
        builder
            .HasMany(u => u.GeneralServiceTaxes)
            .HasPrincipalKey(g => g.Id)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
