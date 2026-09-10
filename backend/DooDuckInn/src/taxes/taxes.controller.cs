using Microsoft.AspNetCore.Mvc;
using DooDuckInn.src.transactions;
using DooDuckInn.src.users;

namespace DooDuckInn.src.taxes;

[ApiController]
[Route("api/taxes")]
public class TaxesController(
    TaxesService taxes,
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
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await taxes.GetAllAsync());
    }

    [HttpGet("{id}/transactions")]
    public async Task<IActionResult> GetTransactionsByTaxId(int id)
    {
        try
        {
            var me = CurrentUserAsync();
            return Ok(await transactions.GetByTaxId(id, me.Id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{id}/transactions")]
    public async Task<IActionResult> CreateTransaction(int id, CreateTransactionRequest request)
    {
        try
        {
            var me = CurrentUserAsync();
            var transaction = await transactions.CreateAsync(id, me.Id, request);
            return CreatedAtAction(nameof(TransactionsController.GetById), "Transactions",
                new { id = transaction.Id }, transaction);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            return Ok(await taxes.GetById(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/dates")]
    public async Task<IActionResult> UpdateDates(int id, TaxRequest request)
    {
        try
        {
            var updated = await taxes.UpdateDatesAsync(id, request);
            return updated ? NoContent() : NotFound($"Tax report {id} not found");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await taxes.DeleteAsync(id);
        return deleted ? NoContent() : NotFound($"Tax report {id} not found");
    }
}
