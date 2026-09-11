using DooDuckInn.src.db;
using DooDuckInn.src.suppliers;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.items;

public class ItemsService(AppDbContext db)
{
    public async Task<Supplier> CheckSuppUserId(int supId, int jwtUserId)
    {
        var supplier = await db.Suppliers.Where(s => s.Id == supId && s.UserId == jwtUserId).FirstOrDefaultAsync();
        if (supplier is null) throw new KeyNotFoundException($"Supplier {supId} or user {jwtUserId} not found.");

        return supplier;
    }

    public async Task<Item> GetById(int itemId, int jwtUserId)
    {
        var item = await db.Items.FirstOrDefaultAsync(t => t.Id == itemId);
        if (item is null) throw new KeyNotFoundException($"Item report {itemId} not found.");
        await CheckSuppUserId(item.SupplierId, jwtUserId);

        return item;
    }

    public async Task<List<Item>> GetBySupplierId(int suppId, int jwtUserId)
    {
        var supplier = await db.Suppliers.FindAsync(suppId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier {suppId} not found.");
        await CheckSuppUserId(supplier.Id, jwtUserId);

        return await db.Items.Where(i => i.SupplierId == suppId).ToListAsync();
    }

    public async Task<Item> CreateAsync(int suppId, int jwtUserId, ItemRequest req)
    {
        var supplier = await db.Suppliers.FindAsync(suppId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier {suppId} not found.");
        await CheckSuppUserId(supplier.Id, jwtUserId);

        var item = new Item(suppId, req.name);
        db.Items.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<bool> UpdateNameAsync(int id, int jwtUserId, string name)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null) return false;
        await CheckSuppUserId(item.SupplierId, jwtUserId);

        item.UpdateName(name);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateQtyAsync(int id, int jwtUserId, int qty)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null) return false;
        await CheckSuppUserId(item.SupplierId, jwtUserId);

        item.UpdateQuantity(qty);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int itemId, int jwtUserId)
    {
        var item = await db.Items.FindAsync(itemId);
        if (item is null) return false;
        await CheckSuppUserId(item.SupplierId, jwtUserId);

        db.Items.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }
}
