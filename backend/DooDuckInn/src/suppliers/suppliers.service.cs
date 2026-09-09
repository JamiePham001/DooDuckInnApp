using DooDuckInn.src.db;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.suppliers;

public class SuppliersService(AppDbContext db)
{
    public Task<List<Supplier>> GetAllAsync()
    {
        return db.Suppliers.ToListAsync();
    }

    public async Task<Supplier> GetById(int supplierId)
    {
        var supplier = await db.Suppliers.FirstOrDefaultAsync(s => s.Id == supplierId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier report {supplierId} not found.");

        return supplier;
    }

    public async Task<List<Supplier>> GetByUserId(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) throw new KeyNotFoundException($"Supplier user {userId} not found.");

        return await db.Suppliers.Where(s => s.UserId == userId).ToListAsync();
    }

    public async Task<Supplier> CreateAsync(int userId, SupplierRequest req)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) throw new KeyNotFoundException($"Supplier user {userId} not found.");

        var supplier = new Supplier(userId, req.name, req.email, req.phone);
        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync();
        return supplier;
    }

    public async Task<bool> UpdateDetailsAsync(int id, SupplierRequest req)
    {
        var supplier = await db.Suppliers.FindAsync(id);
        if (supplier is null) return false;

        supplier.UpdateDetails(req.name, req.email, req.phone);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int supplierId)
    {
        var supplier = await db.Suppliers.FindAsync(supplierId);
        if (supplier is null) return false;

        db.Suppliers.Remove(supplier);
        await db.SaveChangesAsync();
        return true;
    }
}
