using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;
using OdinPos.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace OdinPos.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuthController(AppDbContext db) => _db = db;

    private async Task<User?> GetAdminFromHeader()
    {
        if (!Request.Headers.TryGetValue("x-user-email", out var email)) return null;

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == email.ToString());
        if (u is null) return null;
        if (!u.IsActive) return null;
        if (!string.Equals(u.Role, "Admin", StringComparison.OrdinalIgnoreCase)) return null;
        return u;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Email and Password required");

        var email = req.Email.Trim();

        if (await _db.Users.AnyAsync(x => x.Email == email))
            return BadRequest("User already exists");

        var role = string.IsNullOrWhiteSpace(req.Role) ? "Cashier" : req.Role.Trim();
        if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !role.Equals("Cashier", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Role must be Admin or Cashier");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = req.Name ?? "",
            Email = email,
            PasswordHash = Hash(req.Password),
            Role = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Cashier",
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { user.Id, user.Name, user.Email, user.Role, user.IsActive });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var email = req.Email?.Trim() ?? "";
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);

        if (user is null) return Unauthorized();
        if (!user.IsActive) return Unauthorized();
        if (user.PasswordHash != Hash(req.Password ?? "")) return Unauthorized();

        return Ok(new { user.Id, user.Name, user.Email, user.Role });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var admin = await GetAdminFromHeader();
        if (admin is null) return Unauthorized("Admin only");

        var users = await _db.Users
            .OrderBy(u => u.Role)
            .ThenBy(u => u.Name)
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.IsActive })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{email}/toggle")]
    public async Task<IActionResult> ToggleUser(string email)
    {
        var admin = await GetAdminFromHeader();
        if (admin is null) return Unauthorized("Admin only");

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (u is null) return NotFound();

        u.IsActive = !u.IsActive;
        await _db.SaveChangesAsync();

        return Ok(new { u.Email, u.IsActive });
    }

    private static string Hash(string input)
    {
        using var sha = SHA256.Create();
        return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
    }
}

public record RegisterRequest(string Name, string Email, string Password, string Role);
public record LoginRequest(string Email, string Password);
