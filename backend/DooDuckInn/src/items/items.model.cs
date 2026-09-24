using DooDuckInn.src.suppliers;
namespace DooDuckInn.src.items;

public sealed class Item
{
    public int Id { get; }
    public int SupplierId { get; }
    public string Name { get; private set; } = default!;
    // Nullable rather than defaulting to 0 — the frontend leaves this blank while the user is
    // still typing, and a real 0 is indistinguishable from "not entered yet" once persisted.
    public int? Quantity { get; private set; }

    public Item(int supplierId)
    {
        SupplierId = supplierId;
        Name = string.Empty;
    }

    public void UpdateQuantity(int? qty)
    {
        if (qty < 0) throw new ArgumentException("Quanity must be positive");

        Quantity = qty;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name is required");

        Name = name;
    }
}
