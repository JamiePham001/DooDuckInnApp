using DooDuckInn.src.db;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.transactions;

public class TransactionsService(AppDbContext db)
{
    public Task<List<Transaction>> GetAllAsync()
    {
        return db.Transactions.ToListAsync();
    }

    public Task<List<Transaction>> GetSalesAsync()
    {
        return db.Transactions.Where(t => t.Type == TransactionType.Sale).ToListAsync();
    }

    public Task<List<Transaction>> GetPurchasesAsync()
    {
        return db.Transactions.Where(t => t.Type == TransactionType.Purchase).ToListAsync();
    }

    public async Task<Transaction> GetById(int id)
    {
        var transaction = await db.Transactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction is null) throw new KeyNotFoundException($"Transaction {id} not found.");

        return transaction;
    }

    public async Task<List<Transaction>> GetByTaxId(int taxId)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax {taxId} not found.");

        return await db.Transactions.Where(t => t.TaxId == taxId).ToListAsync();
    }

    public async Task<Transaction> CreateAsync(int taxId, CreateTransactionRequest req)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax {taxId} not found.");

        var transaction = new Transaction(taxId, req.name, req.amount, req.gst, req.type);
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();
        return transaction;
    }

    public async Task<bool> UpdateNameAsync(int id, string name)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;

        transaction.UpdateName(name);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAmountAsync(int id, double amount)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;

        transaction.UpdateAmount(amount);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateGstAsync(int id, double gst)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;

        transaction.UpdateGst(gst);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;

        db.Transactions.Remove(transaction);
        await db.SaveChangesAsync();
        return true;
    }
}
