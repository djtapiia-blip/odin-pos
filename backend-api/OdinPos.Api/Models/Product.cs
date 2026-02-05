namespace OdinPos.Api.Models;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ====== Datos generales ======
    public string Code { get; set; } = "";          // Código
    public string Barcode { get; set; } = "";       // Código de barra
    public string Description { get; set; } = "";   // Descripción

    public string Name { get; set; } = "";          // Nombre (*)
    public decimal Price { get; set; }              // Precio de Venta (*)
    public decimal PromoPrice { get; set; }         // Precio promo (opcional)

    // ====== E-commerce ======
    public string EcommerceName { get; set; } = ""; // Nombre de comercio electrónico
    public decimal EcommercePrice { get; set; }     // Precio e-commerce

    // ====== Categorías ======
    public string Subcategory { get; set; } = "";   // Subcategoría del item
    public string EcommerceCategory { get; set; } = ""; // Categoría e-commerce

    // ====== Estado / visibilidad ======
    public bool IsActive { get; set; } = true;      // Status
    public bool ShowOnIpad { get; set; } = true;    // Mostrar en iPad

    // ====== Comisión ======
    public string CommissionType { get; set; } = "Percent"; // Percent | Fixed
    public decimal CommissionValue { get; set; }            // valor comisión

    // ====== Integración / orden / límites ======
    public string IntegrationCode { get; set; } = ""; // Código de Integración
    public int DisplayOrder { get; set; }             // Orden
    public int MaxOrderQty { get; set; }              // Cantidad máxima de pedido

    // ====== Tiempos (minutos) ======
    public int NextOrderTimeMinutes { get; set; }     // Tiempo para el próximo pedido
    public int PrepTimeMinutes { get; set; }          // Tiempo de preparación
    public string MealHour { get; set; } = "";        // Hora de comida (texto simple)

    // ====== Tipo de item ======
    public string ItemType { get; set; } = "Normal";  // Normal / etc (texto)

    // ====== Impuesto por item ======
    // TaxType: Exempt | Percent
    public string TaxType { get; set; } = "Exempt";
    public decimal TaxPercent { get; set; } = 0;      // si TaxType=Percent (ej 18)

    // ====== Imagen (por URL) ======
    public string ImageUrl { get; set; } = "";

    // ====== Inventario ======
    public int Stock { get; set; }
}
