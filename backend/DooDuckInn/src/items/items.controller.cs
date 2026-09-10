using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.items;

[Authorize]
[ApiController]
[Route("api/items")]
public class ItemController (ItemsService items) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await items.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            return Ok(await items.GetById(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/name")]
    public async Task<IActionResult> UpdateName(int id, string name)
    {
        var updated = await items.UpdateNameAsync(id, name);
        return updated ? NoContent() : NotFound($"Item {id} not found");
    }

    [HttpPatch("{id}/update/quantity")]
    public async Task<IActionResult> UpdateQuantity(int id, int qty)
    {
        var updated = await items.UpdateQtyAsync(id, qty);
        return updated ? NoContent() : NotFound($"Item {id} not found");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await items.DeleteAsync(id);
        return deleted ? NoContent() : NotFound($"Item {id} not found");
    }

}
