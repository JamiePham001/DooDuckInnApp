using DooDuckInn.src.db;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.taxes;

public class TaxesService(AppDbContext db)
{
    public Task<List<Tax>> GetAllAsync()
    {
        return db.Taxes.ToListAsync();
    }

    public async Task<Tax> GetById(int taxId)
    {
        var tax = await db.Taxes.FirstOrDefaultAsync(t => t.Id == taxId);
        if (tax is null) throw new KeyNotFoundException($"Tax report {taxId} not found.");

        return tax;
    }

    public async Task<List<Tax>> GetByUserId(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) throw new KeyNotFoundException($"Tax user {userId} not found.");
        
        return await db.Taxes.Where(t => t.UserId == userId).ToListAsync();
    }

    public async Task<Tax> CreateAsync(int userId, TaxRequest req)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) throw new KeyNotFoundException($"Tax user {userId} not found.");

        var tax = new Tax(userId, req.dateStart, req.dateEnd);
        db.Taxes.Add(tax);
        await db.SaveChangesAsync();
        return tax;
    }

    public async Task<bool> UpdateDatesAsync(int id, TaxRequest req)
    {
        var tax = await db.Taxes.FindAsync(id);
        if (tax is null) return false;

        tax.UpdateDates(req.dateStart, req.dateEnd);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int taxId)
    {
        var tax = await db.Taxes.FindAsync(taxId);
        if (tax is null) return false;

        db.Taxes.Remove(tax);
        await db.SaveChangesAsync();
        return true;
    }
}
