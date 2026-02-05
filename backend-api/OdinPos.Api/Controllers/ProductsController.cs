using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;
using OdinPos.Api.Models;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.Products.OrderBy(x => x.Name).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await _db.Products.FindAsync(id);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Product req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Name is required");

        req.Id = Guid.NewGuid();
        _db.Products.Add(req);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = req.Id }, req);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, Product req)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound();

        p.Name = req.Name;
        p.Price = req.Price;
        p.Stock = req.Stock;
        p.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound();

        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
