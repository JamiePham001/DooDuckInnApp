using Microsoft.AspNetCore.Mvc;
using DooDuckInn.src.taxes;
using DooDuckInn.src.suppliers;
using Microsoft.AspNetCore.Authorization;

namespace DooDuckInn.src.users;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(
    UsersService users,
    TaxesService taxes,
    SuppliersService supplier
    ) : ControllerBase
{
    // The "sub" claim is the caller's Cognito identity, proven by the validated JWT — the one
    // safe source of "who is this", unlike a client-suppliable {id} route param.
    private async Task<User> CurrentUserAsync()
    {
        var sub = User.FindFirst("sub")?.Value
            ?? throw new UnauthorizedAccessException();

        return await users.GetBySubAsync(sub);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            return Ok(await CurrentUserAsync());
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("me/taxes")]
    public async Task<IActionResult> GetMyTaxes()
    {
        try
        {
            var me = await CurrentUserAsync();
            return Ok(await taxes.GetByUserId(me.Id));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("me/suppliers")]
    public async Task<IActionResult> GetMySuppliers()
    {
        try
        {
            var me = await CurrentUserAsync();
            return Ok(await supplier.GetByUserId(me.Id));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    // Called right after Cognito sign-up: the caller already has a valid JWT (so [Authorize]
    // passes) but no local User row yet. The sub comes from the token, never the request body,
    // so nobody can create a row claiming someone else's identity.
    [HttpPost]
    public async Task<IActionResult> Create()
    {
        var sub = User.FindFirst("sub")?.Value;
        if (sub is null) return Unauthorized();

        try
        {
            var user = await users.CreateAsync(sub);
            return CreatedAtAction(nameof(GetMe), user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("me/taxes")]
    public async Task<IActionResult> CreateTax(TaxRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var tax = await taxes.CreateAsync(me.Id, request);
            return CreatedAtAction(nameof(GetMyTaxes), tax);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
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

    [HttpPost("me/suppliers")]
    public async Task<IActionResult> CreateSupplier(SupplierRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var res = await supplier.CreateAsync(me.Id, request);
            return CreatedAtAction(nameof(GetMySuppliers), res);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
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

    [HttpPatch("me/email")]
    public async Task<IActionResult> UpdateEmail(UpdateEmailRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await users.UpdateEmailAsync(me.Id, request);
            return updated ? NoContent() : NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
