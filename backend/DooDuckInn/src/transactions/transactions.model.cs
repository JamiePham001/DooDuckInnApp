namespace DooDuckInn.src.transactions;

public class Transaction
{
    public int Id { get; }
    public int TaxId { get; private set; }
    public string Name { get; private set; } = default!;
    public double Amount { get; private set; } = 0.00;
    public double Gst { get; private set; }
    public TransactionType Type { get; private set; }

    public Transaction(int taxId, string name, double amount, double gst, TransactionType type)
    {
        if (double.IsNegative(amount) || double.IsNegative(gst)) throw new ArgumentException("Amount or gst cant be negative");
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name is required");

        TaxId = taxId;
        Name = name;
        Amount = Math.Round(amount, 2);
        Gst = Math.Round(gst, 2);
        Type = type;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrEmpty(name)) throw new ArgumentException("Name is required");
        Name = name;
    }

    public void UpdateAmount(double amount)
    {
        if (double.IsNegative(amount)) throw new ArgumentException("Amount cant be negative");
        Amount = Math.Round(amount, 2);
    }

    public void UpdateGst(double gst)
    {
        if (double.IsNegative(gst)) throw new ArgumentException("Amount cant be negative");
        Gst = Math.Round(gst, 2);
    }
}

public enum TransactionType
{
    Sale,
    Purchase
}
