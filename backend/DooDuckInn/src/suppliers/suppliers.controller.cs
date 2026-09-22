using System.Text.Json;
using System.Text.Json.Serialization;
using DooDuckInn.src.email;
using DooDuckInn.src.items;
using DooDuckInn.src.users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DooDuckInn.src.suppliers;

[Authorize]
[ApiController]
[Route("api/suppliers")]
public class SuppliersController(
    SuppliersService suppliers,
    ItemsService items,
    UsersService users,
    EmailService email

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
            return Ok(await suppliers.GetById(id, me.Id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(SupplierRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var supplier = await suppliers.CreateAsync(me.Id, request);
            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/items")]
    public async Task<IActionResult> GetItems(int id)
    {
        try
        {
            var me = await CurrentUserAsync();
            return Ok(await items.GetBySupplierId(id, me.Id));
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
            var me = await CurrentUserAsync();
            var item = await items.CreateAsync(supplierId, me.Id, req);
            return CreatedAtAction(nameof(CreateItem), new { id = item.Id }, item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{id}/send-order")]
    public async Task<IActionResult> SendOrder(int id, SendOrderRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var supplierItems = await items.GetBySupplierId(id, me.Id);

            await email.SendAsync(request.RecipientEmail,
                "Doo Duck Inn — Delivery Order",
                OrderEmail.BuildText(request.date, supplierItems),
                htmlBody: OrderEmail.BuildHtml(request.date, supplierItems));

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPatch("{id}/update/details")]
    public async Task<IActionResult> UpdateDetails(int id, SupplierRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var updated = await suppliers.UpdateDetailsAsync(id, me.Id, request);
            return updated ? NoContent() : NotFound($"Supplier {id} not found");
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
            var deleted = await suppliers.DeleteAsync(id, me.Id);
            return deleted ? NoContent() : NotFound($"SUppliers {id} not found");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
