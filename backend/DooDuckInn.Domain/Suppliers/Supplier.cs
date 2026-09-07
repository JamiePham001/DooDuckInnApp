using DooDuckInn.Domain
using DooDuckInn.Domain.Users;
namespace DooDuckInn.Domain.Suppliers;

public sealed class Supplier
{
    public int Id { get; private set; }
    public User User { get; private set;}
}
