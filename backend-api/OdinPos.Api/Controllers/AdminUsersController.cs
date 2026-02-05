using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;
using OdinPos.Api.Models;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminUsersController(AppDbContext db) => _db = db;

    public record CreateUserRequest(string Name, string Email, string Password, string Role);

    // GET /api/admin/users
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Name)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    // POST /api/admin/users
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        var name = (req.Name ?? "").Trim();
        var email = (req.Email ?? "").Trim();
        var pass = (req.Password ?? "").Trim();
        var role = (req.Role ?? "").Trim();

        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name requerido");
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email requerido");
        if (string.IsNullOrWhiteSpace(pass)) return BadRequest("Password requerido");

        var allowed = new[] { "Admin", "Supervisor", "Cashier" };
        if (!allowed.Contains(role)) return BadRequest("Role inválido (Admin/Supervisor/Cashier)");

        var exists = await _db.Users.AnyAsync(u => u.Email == email);
        if (exists) return BadRequest("Ese email ya existe");

        var user = new User
        {
            Name = name,
            Email = email,
            Role = role,
            IsActive = true,

            // ✅ TU MODELO NO TIENE Password, USA PasswordHash
            // (por ahora lo guardamos tal cual; luego lo hasheamos)
            PasswordHash = pass
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { user.Id, user.Name, user.Email, user.Role, user.IsActive });
    }

    // PUT /api/admin/users/{email}/toggle
    [HttpPut("{email}/toggle")]
    public async Task<IActionResult> Toggle(string email)
    {
        var e = (email ?? "").Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == e);
        if (user is null) return NotFound("No existe");

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();

        return Ok(new { user.Email, user.IsActive });
    }
}
