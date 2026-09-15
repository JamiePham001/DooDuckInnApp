using Microsoft.AspNetCore.Mvc;
using DooDuckInn.src.users;
using Microsoft.AspNetCore.Authorization;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace DooDuckInn.src.transactions;

[Authorize]
[ApiController]
[Route("api/transactions")]
public class TransactionsController(
    TransactionsService transactions,
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
            return Ok(await transactions.GetById(id, me.Id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update")]
    public async Task<IActionResult> UpdateInstance(int id, UpdateTransactionRequest req)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await transactions.UpdateInstanceAsync(id, me.Id, req);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
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
            var updated = await transactions.UpdateNameAsync(id, me.Id, name);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/amount")]
    public async Task<IActionResult> UpdateAmount(int id, double amount)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await transactions.UpdateAmountAsync(id, me.Id, amount);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/gst")]
    public async Task<IActionResult> UpdateGst(int id, double gst)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await transactions.UpdateGstAsync(id, me.Id, gst);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/type")]
    public async Task<IActionResult> UpdateType(int id, TransactionType type)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await transactions.UpdateTypeAsync(id, me.Id, type);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
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
            var deleted = await transactions.DeleteAsync(id, me.Id);
            return deleted ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }

    }
}
