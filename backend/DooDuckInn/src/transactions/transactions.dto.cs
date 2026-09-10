namespace DooDuckInn.src.transactions;

public record CreateTransactionRequest(int taxId, string name, double amount, double gst, TransactionType type);
