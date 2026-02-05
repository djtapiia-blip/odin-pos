using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;
using OdinPos.Api.Models;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/sales")]
public class SalesController : ControllerBase
{
    private readonly AppDbContext _db;
    public SalesController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create(CreateSaleRequest req)
    {
        if (req.Items is null || req.Items.Count == 0) return BadRequest("Items required");
        if (string.IsNullOrWhiteSpace(req.CreatedByEmail)) return BadRequest("CreatedByEmail required");

        var pm = string.IsNullOrWhiteSpace(req.PaymentMethod) ? "Cash" : req.PaymentMethod.Trim();
        if (pm != "Cash" && pm != "Card") return BadRequest("PaymentMethod must be Cash or Card");

        var ids = req.Items.Select(x => x.ProductId).ToList();
        var products = await _db.Products.Where(p => ids.Contains(p.Id)).ToListAsync();

        foreach (var it in req.Items)
        {
            var p = products.FirstOrDefault(x => x.Id == it.ProductId);
            if (p is null) return BadRequest($"Product not found: {it.ProductId}");
            if (!p.IsActive) return BadRequest($"Product inactive: {p.Name}");
            if (it.Qty <= 0) return BadRequest("Qty must be > 0");
            if (p.Stock < it.Qty) return BadRequest($"Not enough stock for: {p.Name}");
        }

        var sale = new Sale
        {
            PaymentMethod = pm,
            CreatedByEmail = req.CreatedByEmail.Trim()
        };

        foreach (var it in req.Items)
        {
            var p = products.First(x => x.Id == it.ProductId);
            p.Stock -= it.Qty;

            sale.Items.Add(new SaleItem
            {
                Id = Guid.NewGuid(),
                ProductId = p.Id,
                Name = p.Name,
                Price = p.Price,
                Qty = it.Qty
            });
        }

        sale.Total = sale.Items.Sum(x => x.LineTotal);

        if (sale.PaymentMethod == "Cash")
        {
            if (req.CashReceived <= 0) return BadRequest("CashReceived required for Cash payment");
            if (req.CashReceived < sale.Total) return BadRequest("CashReceived must be >= Total");
            sale.CashReceived = req.CashReceived;
            sale.Change = req.CashReceived - sale.Total;
        }
        else
        {
            sale.CashReceived = 0;
            sale.Change = 0;
        }

        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();

        return Ok(sale);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var q = _db.Sales.Include(s => s.Items).AsQueryable();

        if (from.HasValue) q = q.Where(s => s.CreatedAt >= from.Value.ToUniversalTime());
        if (to.HasValue) q = q.Where(s => s.CreatedAt <= to.Value.ToUniversalTime().AddDays(1).AddTicks(-1));

        return Ok(await q.OrderByDescending(x => x.CreatedAt).ToListAsync());
    }
}

public record CreateSaleRequest(
    List<CreateSaleItem> Items,
    string PaymentMethod,
    decimal CashReceived,
    string CreatedByEmail
);

public record CreateSaleItem(Guid ProductId, int Qty);
