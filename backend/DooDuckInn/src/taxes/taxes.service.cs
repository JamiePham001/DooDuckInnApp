using DooDuckInn.src.db;
using DooDuckInn.src.transactions;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.taxes;

public class TaxesService(AppDbContext db)
{
    public async Task<Tax> GetById(int taxId, int jwtUserId)
    {
        var tax = await db.Taxes.FirstOrDefaultAsync(t => t.Id == taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax report {taxId} not found.");
        if (tax.UserId != jwtUserId) throw new KeyNotFoundException($"User {jwtUserId} mismatch.");

        return tax;
    }

    public async Task<List<Tax>> GetByUserId(int jwtUserId)
    {
        return await db.Taxes.Where(t => t.UserId == jwtUserId)
            .OrderByDescending(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<Tax> CreateAsync(int jwtUserId, TaxRequest req)
    {
        var tax = new Tax(jwtUserId, req.dateStart, req.dateEnd);
        db.Taxes.Add(tax);
        // tax.Id is DB-generated and still 0 until this save actually assigns it — the
        // seeded Transactions below capture TaxId by value, not via a navigation
        // property, so they'd otherwise all be saved with TaxId 0 instead of tax.Id.
        await db.SaveChangesAsync();

        // Populate tax report with essential transaction rows that will appear on every tax report
        db.Transactions.AddRange(
            new Transaction(tax.Id, "Stock", type: TransactionType.Sale),
            new Transaction(tax.Id, "Till", type: TransactionType.Sale),
            new Transaction(tax.Id, "Containers/Cups/wrap Paper/Paper Boxes", type: TransactionType.Sale),
            new Transaction(tax.Id, "Western Power", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Alinta Gas", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Instant Waste Management", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Western Resource", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Telstra", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Fuel", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Shop Rent", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Strata Fee", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Gordon Q C Du", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Water Fees", type: TransactionType.Purchase),
            new Transaction(tax.Id, "Bank Fees", type: TransactionType.Purchase));

        await db.SaveChangesAsync();
        return tax;
    }

    public async Task<bool> UpdateDatesAsync(int id, int jwtUserId, TaxRequest req)
    {
        var tax = await db.Taxes.FindAsync(id);
        if (tax is null) return false;
        if (tax.UserId != jwtUserId) throw new KeyNotFoundException($"User {jwtUserId} mismatch.");

        tax.UpdateDates(req.dateStart, req.dateEnd);
        await db.SaveChangesAsync();
        return true;
    }

    // Called by the report pipeline only after SES confirms the email actually sent —
    // never from a client-facing endpoint, so there's no jwtUserId to check against here.
    public async Task MarkSentAsync(int taxId)
    {
        var tax = await db.Taxes.FindAsync(taxId)
            ?? throw new KeyNotFoundException($"Tax report {taxId} not found.");

        tax.MarkSent();
        await db.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int taxId, int jwtUserId)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) return false;
        if (tax.UserId != jwtUserId) throw new KeyNotFoundException($"User {jwtUserId} mismatch.");

        db.Taxes.Remove(tax);
        await db.SaveChangesAsync();
        return true;
    }
}
