using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.transactions;

[ApiController]
[Route("api/transactions")]
public class TransactionsController(TransactionsService transactions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await transactions.GetAllAsync());
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSales()
    {
        return Ok(await transactions.GetSalesAsync());
    }

    [HttpGet("purchases")]
    public async Task<IActionResult> GetPurchases()
    {
        return Ok(await transactions.GetPurchasesAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            return Ok(await transactions.GetById(id));
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
            var updated = await transactions.UpdateNameAsync(id, name);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPatch("{id}/update/amount")]
    public async Task<IActionResult> UpdateAmount(int id, double amount)
    {
        try
        {
            var updated = await transactions.UpdateAmountAsync(id, amount);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPatch("{id}/update/gst")]
    public async Task<IActionResult> UpdateGst(int id, double gst)
    {
        try
        {
            var updated = await transactions.UpdateGstAsync(id, gst);
            return updated ? NoContent() : NotFound($"Transaction {id} not found");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await transactions.DeleteAsync(id);
        return deleted ? NoContent() : NotFound($"Transaction {id} not found");
    }
}
