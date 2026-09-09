using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.suppliers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController(SuppliersService suppliers) : ControllerBase
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
