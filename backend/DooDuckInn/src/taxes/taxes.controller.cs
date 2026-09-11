using Microsoft.AspNetCore.Mvc;
using DooDuckInn.src.transactions;
using DooDuckInn.src.users;
using DooDuckInn.src.email;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Fluent;

namespace DooDuckInn.src.taxes;

[Authorize]
[ApiController]
[Route("api/taxes")]
public class TaxesController(
    TaxesService taxes,
    TransactionsService transactions,
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

    [HttpGet("{id}/transactions")]
    public async Task<IActionResult> GetTransactionsByTaxId(int id)
    {
        try
        {
            var me = await CurrentUserAsync();
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
            var me = await CurrentUserAsync();
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
            var me = await CurrentUserAsync();
            return Ok(await taxes.GetById(id, me.Id));
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
            var me = await CurrentUserAsync();
            var updated = await taxes.UpdateDatesAsync(id, me.Id, request);
            return updated ? NoContent() : NotFound($"Tax report {id} not found");
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

    [HttpPost("{id}/send-report")]
    public async Task<IActionResult> SendReport(int id, SendReportRequest request)
    {
        try
        {
            var me = await CurrentUserAsync();
            var tax = await taxes.GetById(id, me.Id);
            var taxTransactions = await transactions.GetByTaxId(id, me.Id);

            var pdf = new TaxReportDocument(tax, [.. taxTransactions]).GeneratePdf();
            var attachment = new EmailAttachment("gst-report.pdf", pdf, "application/pdf");

            await email.SendAsync(
                request.RecipientEmail,
                $"GST Report — {tax.StartDate:MMMM yyyy} to {tax.EndDate:MMMM yyyy}",
                "Please find the attached GST report.",
                attachment);

            await taxes.MarkSentAsync(id);
            return NoContent();
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
            var deleted = await taxes.DeleteAsync(id, me.Id);
            return deleted ? NoContent() : NotFound($"Tax report {id} not found");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
