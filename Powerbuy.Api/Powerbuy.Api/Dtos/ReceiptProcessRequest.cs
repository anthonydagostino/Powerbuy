namespace Powerbuy.Api.Dtos;

public class ReceiptProcessRequest
{
    public List<ReceiptItemDto> Items { get; set; } = new();
    public DateTime? EmailDate { get; set; }
}

public class ReceiptItemDto
{
    public string Upc { get; set; } = string.Empty;
    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}