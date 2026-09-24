namespace DooDuckInn.src.digests;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/digests")]
public class DigestsController(DigestsService digests) : ControllerBase
{
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest() => Ok(await digests.GetLatestAsync());

    // Manual trigger for the same job DailyDigestBackgroundService runs on its schedule — lets
    // the digest be refreshed on demand (testing, or if the scheduled run is ever missed) instead
    // of only firing once a day at noon Perth time.
    [HttpPost("run")]
    public async Task<IActionResult> RunNow()
    {
        var today = DateOnly.FromDateTime(
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Australia/Perth")));
        return Ok(await digests.RunAsync(today));
    }
}
