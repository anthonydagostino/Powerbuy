namespace Powerbuy.Api.Models;

public class Purchase
{
    public int Id { get; set; }

    public string Item { get; set; } = string.Empty;

    public decimal TotalAmazon { get; set; }

    public decimal SellPrice { get; set; }

    public decimal Cashback5Percent { get; set; }

    public decimal Cashback6Percent { get; set; }

    public decimal Cashback7Percent { get; set; }

    public decimal Profit5Percent { get; set; }

    public decimal Profit6Percent { get; set; }

    public decimal Profit7Percent { get; set; }

    public DateTime OrderPlaced { get; set; }

    public int Quantity { get; set; }

    public DateTime Expires { get; set; }

    public string Upc { get; set; }

    public string Model { get; set; }

    public string CardUsed { get; set; }

    public string BoughtFrom { get; set; }

    public string DeliveryStatus { get; set; } = "Pending";

    public string PaymentStatus { get; set; } = "Unpaid";

    public DateTime? PaymentDate { get; set; }

    public string? TrackingNumber { get; set; }

    public int QuantityPaid { get; set; }

    public decimal AmountPaid { get; set; }


    public string UserId { get; set; } = string.Empty;
}