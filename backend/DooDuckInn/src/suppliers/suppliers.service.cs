using DooDuckInn.src.db;
using DooDuckInn.src.taxes;
using DooDuckInn.src.users;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.suppliers;

public class SuppliersService(AppDbContext db)
{
    public async Task<Supplier> GetById(int supplierId, int jwtUserId)
    {
        var supplier = await db.Suppliers.FirstOrDefaultAsync(s => s.Id == supplierId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier report {supplierId} not found.");
        if (supplier.UserId != jwtUserId) throw new KeyNotFoundException($"User {jwtUserId} mismatch.");

        return supplier;
    }

    public async Task<List<Supplier>> GetByUserId(int jwtUserId)
    {
        return await db.Suppliers.Where(s => s.UserId == jwtUserId).ToListAsync();
    }

    public async Task<Supplier> CreateAsync(int jwtUserId, SupplierRequest req)
    {
        var supplier = new Supplier(jwtUserId, req.name, req.email, req.phone);
        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync();
        return supplier;
    }

    public async Task<bool> UpdateDetailsAsync(int id, int jwtUserId, SupplierRequest req)
    {
        var supplier = await db.Suppliers.FindAsync(id);
        if (supplier is null) return false;
        if (supplier.UserId != jwtUserId) throw new KeyNotFoundException($"User {jwtUserId} mismatch.");

        supplier.UpdateDetails(req.name, req.email, req.phone);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int supplierId, int jwtUserId)
    {
        var supplier = await db.Suppliers.FindAsync(supplierId);
        if (supplier is null) return false;
        if (supplier.UserId != jwtUserId) throw new KeyNotFoundException($"User {jwtUserId} mismatch.");

        db.Suppliers.Remove(supplier);
        await db.SaveChangesAsync();
        return true;
    }
}
