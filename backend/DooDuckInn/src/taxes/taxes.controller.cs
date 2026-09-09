using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.taxes;

[ApiController]
[Route("api/taxes")]
public class TaxesController(TaxesService taxes) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await taxes.GetAllAsync());
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
