using DooDuckInn.src.suppliers;
namespace DooDuckInn.src.items;

public sealed class Item
{
    public int Id { get; }
    public int SupplierId { get; }
    public string Name { get; private set; } = default!;
    public int Quantity { get; private set; } = 0;

    public Item(int supplierId, string name)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name is required");

        SupplierId = supplierId;
        Name = name;
    }

    public void UpdateQuantity(int qty)
    {
        if (int.IsNegative(qty)) throw new ArgumentException("Quanity must be positive");

        Quantity = qty;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name is required");

        Name = name;
    }
}
