using DooDuckInn.src.db;
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
        return await db.Taxes.Where(t => t.UserId == jwtUserId).ToListAsync();
    }

    public async Task<Tax> CreateAsync(int jwtUserId, TaxRequest req)
    {
        var tax = new Tax(jwtUserId, req.dateStart, req.dateEnd);
        db.Taxes.Add(tax);
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
