using DooDuckInn.src.db;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.transactions;

public class TransactionsService(AppDbContext db)
{
    public async Task<Tax> CheckTransUserId(int taxId, int jwtUserId)
    {
        var tax = await db.Taxes.Where(t => t.Id == taxId && t.UserId == jwtUserId).FirstOrDefaultAsync();
        if (tax is null) throw new KeyNotFoundException($"Tax Report {taxId} or user {jwtUserId} not found.");

        return tax;
    }

    public async Task<Transaction> GetById(int id, int jwtUserId)
    {
        var transaction = await db.Transactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction is null) throw new KeyNotFoundException($"Transaction {id} not found.");
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        return transaction;
    }

    public async Task<List<Transaction>> GetByTaxId(int taxId, int jwtUserId)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax {taxId} not found.");
        await CheckTransUserId(tax.Id, jwtUserId);

        return await db.Transactions.Where(t => t.TaxId == taxId).ToListAsync();
    }

    public async Task<Transaction> CreateAsync(int taxId, int jwtUserId, CreateTransactionRequest req)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax {taxId} not found.");
        await CheckTransUserId(tax.Id, jwtUserId);

        var transaction = new Transaction(taxId, req.name, req.amount, req.gst, req.type);
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();
        return transaction;
    }

    public async Task<bool> UpdateNameAsync(int id, int jwtUserId, string name)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateName(name);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAmountAsync(int id, int jwtUserId, double amount)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateAmount(amount);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateGstAsync(int id, int jwtUserId, double gst)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateGst(gst);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id, int jwtUserId)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        db.Transactions.Remove(transaction);
        await db.SaveChangesAsync();
        return true;
    }
}
