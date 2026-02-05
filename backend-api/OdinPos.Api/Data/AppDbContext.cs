using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Models;

namespace OdinPos.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ✅ Email único
        modelBuilder.Entity<User>()
            .HasIndex(x => x.Email)
            .IsUnique();

        // ✅ Sale (1) -> (many) SaleItems por SaleId
        modelBuilder.Entity<Sale>()
            .HasMany(s => s.Items)
            .WithOne()
            .HasForeignKey(i => i.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        base.OnModelCreating(modelBuilder);
    }
}
