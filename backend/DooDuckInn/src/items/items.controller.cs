using DooDuckInn.src.users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.items;

[Authorize]
[ApiController]
[Route("api/items")]
public class ItemController(
    ItemsService items,
    UsersService users
    ) : ControllerBase
{
    private async Task<User> CurrentUserAsync()
    {
        var sub = User.FindFirst("sub")?.Value
            ?? throw new UnauthorizedAccessException();

        return await users.GetBySubAsync(sub);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var me = await CurrentUserAsync();
            return Ok(await items.GetById(id, me.Id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/name")]
    public async Task<IActionResult> UpdateName(int id, string name)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await items.UpdateNameAsync(id, me.Id, name);
            return updated ? NoContent() : NotFound($"Item {id} not found");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/quantity")]
    public async Task<IActionResult> UpdateQuantity(int id, int? qty)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await items.UpdateQtyAsync(id, me.Id, qty);
            return updated ? NoContent() : NotFound($"Item {id} not found");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }

    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var me = await CurrentUserAsync();
            var deleted = await items.DeleteAsync(id, me.Id);
            return deleted ? NoContent() : NotFound($"Item {id} not found");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }

    }

}
