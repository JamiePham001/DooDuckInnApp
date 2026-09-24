using DooDuckInn.src.db;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.transactions;

public class TransactionsService(AppDbContext db, TransactionAgent agent)
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

    // Discards imageBytes after the Claude call — nothing persists the image, per design.
    public async Task<Transaction> CreateFromImageAsync(int taxId, int jwtUserId, byte[] imageBytes, string mediaType)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax {taxId} not found.");
        await CheckTransUserId(tax.Id, jwtUserId);

        var extracted = await agent.ExtractFromImageAsync(imageBytes, mediaType);
        var existingTransactions = await db.Transactions.Where(t => t.TaxId == taxId).ToListAsync();

        // ai workflow that checks whether the scanned document should update an existing
        // transaction (e.g. a recurring bill under a different name) or create a new one.
        var matchedId = existingTransactions.Count == 0
            ? -1
            : await agent.CheckExistsAsync(extracted.Name, existingTransactions);

        if (matchedId == -1)
        {
            var transaction = new Transaction(taxId, extracted.Name, extracted.Amount, extracted.Gst, extracted.Type);
            db.Transactions.Add(transaction);
            await db.SaveChangesAsync();
            return transaction;
        }

        var matched = existingTransactions.First(t => t.Id == matchedId);
        matched.UpdateNums(extracted.Amount, extracted.Gst);
        await db.SaveChangesAsync();
        return matched;
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

    public async Task<bool> UpdateInstanceAsync(int id, int jwtUserId, UpdateTransactionRequest req)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateInstance(req.name, req.amount, req.gst, req.type);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAmountAsync(int id, int jwtUserId, double? amount)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateAmount(amount);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateGstAsync(int id, int jwtUserId, double? gst)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateGst(gst);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateTypeAsync(int id, int jwtUserId, TransactionType type)
    {
        var transaction = await db.Transactions.FindAsync(id);
        if (transaction is null) return false;
        await CheckTransUserId(transaction.TaxId, jwtUserId);

        transaction.UpdateType(type);
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
