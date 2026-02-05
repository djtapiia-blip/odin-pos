using Microsoft.AspNetCore.Mvc;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", name = "Odin PoS API" });
}
