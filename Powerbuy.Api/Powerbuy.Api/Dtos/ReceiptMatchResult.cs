namespace Powerbuy.Api.Dtos;

public class ReceiptMatchResult
{
    public string Upc { get; set; } = "";
    public string Result { get; set; } = "";
    public int? PurchaseId { get; set; }
    public int? QuantityPaid { get; set; }
    public decimal? AmountPaid { get; set; }
    public decimal? ExpectedSellPrice { get; set; }
}
