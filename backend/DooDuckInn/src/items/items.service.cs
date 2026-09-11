using DooDuckInn.src.db;
using DooDuckInn.src.suppliers;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.items;

public class ItemsService(AppDbContext db)
{
    public async Task<Supplier> CheckSuppUserId(int supId, int userId)
    {
        var supplier = await db.Suppliers.Where(s => s.Id == supId && s.UserId == userId).FirstOrDefaultAsync();
        if (supplier is null) throw new KeyNotFoundException($"Supplier {supId} or user {userId} not found.");

        return supplier;
    }

    public async Task<Item> GetById(int itemId, int userId)
    {
        var item = await db.Items.FirstOrDefaultAsync(t => t.Id == itemId);
        if (item is null) throw new KeyNotFoundException($"Item report {itemId} not found.");
        await CheckSuppUserId(item.SupplierId, userId);

        return item;
    }

    public async Task<List<Item>> GetBySupplierId(int suppId, int userId)
    {
        var supplier = await db.Suppliers.FindAsync(suppId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier {suppId} not found.");
        await CheckSuppUserId(supplier.Id, userId);

        return await db.Items.Where(i => i.SupplierId == suppId).ToListAsync();
    }

    public async Task<Item> CreateAsync(int suppId, int userId, ItemRequest req)
    {
        var supplier = await db.Suppliers.FindAsync(suppId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier {suppId} not found.");
        await CheckSuppUserId(supplier.Id, userId);

        var item = new Item(suppId, req.name);
        db.Items.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<bool> UpdateNameAsync(int id, int userId, string name)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null) return false;
        await CheckSuppUserId(item.SupplierId, userId);

        item.UpdateName(name);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateQtyAsync(int id, int userId, int qty)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null) return false;
        await CheckSuppUserId(item.SupplierId, userId);

        item.UpdateQuantity(qty);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int itemId, int userId)
    {
        var item = await db.Items.FindAsync(itemId);
        if (item is null) return false;
        await CheckSuppUserId(item.SupplierId, userId);

        db.Items.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }
}
