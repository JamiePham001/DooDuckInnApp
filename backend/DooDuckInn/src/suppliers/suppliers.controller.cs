using DooDuckInn.src.items;
using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.suppliers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController(
    SuppliersService suppliers,
    ItemsService items
    ) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await suppliers.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            return Ok(await suppliers.GetById(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{supplierId:int}/item")]
    public async Task<IActionResult> CreateItem(int supplierId, ItemRequest req)
    {
        try
        {
            var item = await items.CreateAsync(supplierId, req);
            return CreatedAtAction(nameof(CreateItem), new { id = item.Id }, item);
        }
        catch (KeyNotFoundException ex)
        {

            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/details")]
    public async Task<IActionResult> UpdateDetails(int id, SupplierRequest request)
    {
        var updated = await suppliers.UpdateDetailsAsync(id, request);
        return updated ? NoContent() : NotFound($"Supplier {id} not found");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await suppliers.DeleteAsync(id);
        return deleted ? NoContent() : NotFound($"SUppliers {id} not found");
    }
}
