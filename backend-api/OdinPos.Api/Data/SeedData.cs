using OdinPos.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace OdinPos.Api.Data;

public static class SeedData
{
    public static void Initialize(AppDbContext db)
    {
        // Si ya existe el admin por email, no lo dupliques
        if (db.Users.Any(u => u.Email == "admin@odin.com")) return;

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Name = "Administrador",
            Email = "admin@odin.com",
            PasswordHash = Hash("admin123"),
            Role = "Admin",
            IsActive = true
        };

        db.Users.Add(admin);
        db.SaveChanges();
    }

    private static string Hash(string input)
    {
        using var sha = SHA256.Create();
        return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
    }
}
