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
}
