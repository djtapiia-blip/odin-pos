namespace OdinPos.Api.Models;

public class Sale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string PaymentMethod { get; set; } = "Cash"; // Cash | Card
    public decimal CashReceived { get; set; }
    public decimal Change { get; set; }

    public string CreatedByEmail { get; set; } = "";

    public decimal Total { get; set; }

    // ✅ Relación 1 a muchos
    public List<SaleItem> Items { get; set; } = new();
}

public class SaleItem
{
    public Guid Id { get; set; } = Guid.NewGuid(); // ✅ PK
    public Guid SaleId { get; set; }              // ✅ FK hacia Sale

    public Guid ProductId { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Qty { get; set; }

    public decimal LineTotal => Price * Qty;
}
