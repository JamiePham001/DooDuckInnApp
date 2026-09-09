namespace DooDuckInn.src.suppliers;

public sealed class Supplier
{
    public int Id { get;}
    public int UserId { get;}
    public string Name { get; private set; } = default!;
    public string Email { get; private set; } = default!;
    public string Phone { get; private set; } = string.Empty;

    private Supplier() { }  // for EF Core materialization

    public Supplier(int userId, string name, string email, string phone)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name is required");
        if (string.IsNullOrEmpty(email)) throw new ArgumentException("Email is required");

        UserId = userId;
        Name = name;
        Email = email;
        Phone = phone;
    }

    public void UpdateDetails(string name, string email, string phone)
    {
        Name = string.IsNullOrEmpty(name) ? Name : name;
        Email = string.IsNullOrEmpty(email) ? Email : email;
        Phone = string.IsNullOrEmpty(phone) ? Phone : phone;
    }
}
