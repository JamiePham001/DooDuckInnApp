namespace DooDuckInn.src.transactions;

public class Transaction
{
    public int Id { get; }
    public int TaxId { get; private set; }
    public string Name { get; private set; } = default!;
    // Nullable rather than defaulting to 0 — the frontend leaves these blank while the user is
    // still typing, and a real 0 is indistinguishable from "not entered yet" once persisted.
    public double? Amount { get; private set; }
    public double? Gst { get; private set; }
    public TransactionType Type { get; private set; }

    private Transaction() { }
    public Transaction(int taxId, string name, TransactionType type)
    {
        TaxId = taxId;
        Name = name ?? "";

        Type = type;
    }
    public Transaction(int taxId, string name, double? amount, double? gst, TransactionType type)
    {
        if (amount < 0 || gst < 0) throw new ArgumentException("Amount or gst cant be negative");

        TaxId = taxId;
        Name = name ?? "";
        Amount = Round(amount);
        Gst = Round(gst);
        Type = type;
    }

    public void UpdateInstance(string name, double? amount, double? gst, TransactionType type)
    {
        if (amount < 0 || gst < 0) throw new ArgumentException("Amount or gst cant be negative");

        Name = name ?? "";
        Amount = Round(amount);
        Gst = Round(gst);
        Type = type;
    }

    public void UpdateNums(double? amount, double? gst)
    {
        if (amount < 0 || gst < 0) throw new ArgumentException("Amount or gst cant be negative");

        Amount = Round(amount);
        Gst = Round(gst);
    }

    public void UpdateName(string name)
    {
        Name = name ?? "";
    }

    public void UpdateAmount(double? amount)
    {
        if (amount < 0) throw new ArgumentException("Amount cant be negative");
        Amount = Round(amount);
    }

    public void UpdateGst(double? gst)
    {
        if (gst < 0) throw new ArgumentException("Amount cant be negative");
        Gst = Round(gst);
    }

    public void UpdateType(TransactionType type)
    {
        Type = type;
    }

    private static double? Round(double? value) => value is null ? null : Math.Round(value.Value, 2);
}

public enum TransactionType
{
    Sale,
    Purchase
}
