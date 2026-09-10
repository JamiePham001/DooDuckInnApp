using DooDuckInn.src.db;
using DooDuckInn.src.taxes;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.items;

public class ItemsService(AppDbContext db)
{
    public Task<List<Item>> GetAllAsync()
    {
        return db.Items.ToListAsync();
    }

    public async Task<Item> GetById(int itemId)
    {
        var item = await db.Items.FirstOrDefaultAsync(t => t.Id == itemId);
        if (item is null) throw new KeyNotFoundException($"Item report {itemId} not found.");

        return item;
    }

    public async Task<List<Item>> GetBySupplierId(int suppId)
    {
        var supplier = await db.Suppliers.FindAsync(suppId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier {suppId} not found.");

        return await db.Items.Where(i => i.SupplierId == suppId).ToListAsync();
    }

    public async Task<Item> CreateAsync(int suppId, ItemRequest req)
    {
        var supplier = await db.Suppliers.FindAsync(suppId);
        if (supplier is null) throw new KeyNotFoundException($"Supplier {suppId} not found.");

        var item = new Item(suppId, req.name);
        db.Items.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<bool> UpdateNameAsync(int id, string name)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null) return false;

        item.UpdateName(name);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateQtyAsync(int id, int qty)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null) return false;

        item.UpdateQuantity(qty);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int itemId)
    {
        var item = await db.Items.FindAsync(itemId);
        if (item is null) return false;

        db.Items.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }
}
