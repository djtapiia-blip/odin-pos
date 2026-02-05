using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductLookupController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductLookupController(AppDbContext db) => _db = db;

    // GET /api/products/lookup?barcode=123
    // GET /api/products/lookup?code=ABC
    [HttpGet("lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string? barcode, [FromQuery] string? code)
    {
        var b = (barcode ?? "").Trim();
        var c = (code ?? "").Trim();

        if (string.IsNullOrWhiteSpace(b) && string.IsNullOrWhiteSpace(c))
            return BadRequest("barcode or code is required");

        var q = _db.Products.AsNoTracking().Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(b))
            q = q.Where(p => p.Barcode == b);

        if (!string.IsNullOrWhiteSpace(c))
            q = q.Where(p => p.Code == c);

        var p = await q.FirstOrDefaultAsync();
        if (p is null) return NotFound();

        return Ok(p);
    }
}
