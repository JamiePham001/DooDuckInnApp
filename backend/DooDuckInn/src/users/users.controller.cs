using Microsoft.AspNetCore.Mvc;
using DooDuckInn.src.taxes;
using DooDuckInn.src.suppliers;

namespace DooDuckInn.src.users;

[ApiController]
[Route("api/users")]
public class UsersController(
    UsersService users,
    TaxesService taxes,
    SuppliersService supplier
    ) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await users.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            return Ok(await users.GetById(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("{id}/taxes")]
    public async Task<IActionResult> GetTaxesbyUserId(int id)
    {
        try
        {
            return Ok(await taxes.GetByUserId(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("{id}/suppliers")]
    public async Task<IActionResult> GetSuppliersbyUserId(int id)
    {
        try
        {
            return Ok(await supplier.GetByUserId(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        try
        {
            var user = await users.CreateAsync(request.CognitoSub);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/taxes")]
    public async Task<IActionResult> CreateTax(int id, TaxRequest request)
    {
        try
        {
            var tax = await taxes.CreateAsync(id, request);
            return CreatedAtAction(nameof(GetById), new { id = tax.Id }, tax);
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

    [HttpPost("{id}/suppliers")]
    public async Task<IActionResult> CreateSupplier(int id, SupplierRequest request)
    {
        try
        {
            var res = await supplier.CreateAsync(id, request);
            return CreatedAtAction(nameof(GetById), new { id = res.Id }, res);
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

    [HttpPatch("{id}/email")]
    public async Task<IActionResult> UpdateEmail(int id, UpdateEmailRequest request)
    {
        var updated = await users.UpdateEmailAsync(id, request);
        return updated ? NoContent() : NotFound($"User {id} not found");
    }
}
