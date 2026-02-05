using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    // GET /api/reports/closeout?date=2026-02-04
    [HttpGet("closeout")]
    public async Task<IActionResult> Closeout([FromQuery] string date)
    {
        if (string.IsNullOrWhiteSpace(date))
            return BadRequest("date is required. Example: 2026-02-04");

        if (!DateOnly.TryParse(date, out var d))
            return BadRequest("Invalid date format. Use YYYY-MM-DD");

        // Rango UTC del día
        var fromUtc = d.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtc = d.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var sales = await _db.Sales
            .AsNoTracking()
            .Where(s => s.CreatedAt >= fromUtc && s.CreatedAt <= toUtc)
            .Select(s => new
            {
                s.Total,
                PaymentMethod = s.PaymentMethod ?? "Cash",
                ItemsQty = s.Items.Sum(i => i.Qty)
            })
            .ToListAsync();

        var total = sales.Sum(x => x.Total);
        var totalCash = sales.Where(x => x.PaymentMethod == "Cash").Sum(x => x.Total);
        var totalCard = sales.Where(x => x.PaymentMethod == "Card").Sum(x => x.Total);

        return Ok(new
        {
            date = d.ToString("yyyy-MM-dd"),
            salesCount = sales.Count,
            itemsQty = sales.Sum(x => x.ItemsQty),
            total,
            totalCash,
            totalCard
        });
    }
}
