using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using Powerbuy.Api.Dtos;

namespace Powerbuy.Api.Services;

public class ReceiptService
{
    private readonly AppDbContext _context;

    public ReceiptService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReceiptMatchResult>> ProcessReceiptAsync(ReceiptProcessRequest request, string userId)
    {
        var results = new List<ReceiptMatchResult>();

        foreach (var item in request.Items)
        {
            var normalizedUpc = NormalizeDigits(item.Upc);

            var candidatePurchases = await _context.Purchases
                .Where(p => p.UserId == userId &&
                            (p.PaymentStatus == "Not Paid" || p.PaymentStatus == "Half" || p.PaymentStatus == "Issue"))
                .ToListAsync();

            var purchase = candidatePurchases
                .Where(p => NormalizeDigits(p.Upc) == normalizedUpc)
                .OrderBy(p => p.Id)
                // For Not Paid / Issue entries QuantityPaid is unreliable; only gate on quantity for Half
                .FirstOrDefault(p => p.PaymentStatus != "Half" || p.QuantityPaid < p.Quantity);

            if (purchase == null)
            {
                results.Add(new ReceiptMatchResult { Upc = item.Upc, Result = "No Match" });
                continue;
            }

            var expectedSellPrice = purchase.SellPrice;

            if (purchase.PaymentStatus == "Not Paid" || purchase.PaymentStatus == "Issue")
            {
                if (purchase.Quantity == item.Qty && NearlyEqual(expectedSellPrice, item.Total))
                {
                    purchase.PaymentStatus = "Paid";
                    purchase.DeliveryStatus = "Delivered";
                    purchase.PaymentDate = DateTime.UtcNow;
                    purchase.QuantityPaid = item.Qty;
                    purchase.AmountPaid = item.Total;

                    results.Add(new ReceiptMatchResult
                    {
                        Upc = item.Upc,
                        Result = "Paid",
                        PurchaseId = purchase.Id,
                        QuantityPaid = purchase.QuantityPaid,
                        AmountPaid = purchase.AmountPaid
                    });
                }
                else if (purchase.Quantity != item.Qty)
                {
                    purchase.PaymentStatus = "Half";
                    purchase.PaymentDate = DateTime.UtcNow;
                    purchase.QuantityPaid = item.Qty;
                    purchase.AmountPaid = item.Total;

                    results.Add(new ReceiptMatchResult
                    {
                        Upc = item.Upc,
                        Result = "Half",
                        PurchaseId = purchase.Id,
                        QuantityPaid = purchase.QuantityPaid,
                        AmountPaid = purchase.AmountPaid
                    });
                }
                else
                {
                    purchase.PaymentStatus = "Issue";
                    purchase.PaymentDate = DateTime.UtcNow;
                    purchase.QuantityPaid = item.Qty;
                    purchase.AmountPaid = item.Total;

                    results.Add(new ReceiptMatchResult
                    {
                        Upc = item.Upc,
                        Result = "Issue",
                        PurchaseId = purchase.Id,
                        ExpectedSellPrice = expectedSellPrice,
                        AmountPaid = purchase.AmountPaid
                    });
                }
            }
            else if (purchase.PaymentStatus == "Half")
            {
                purchase.QuantityPaid += item.Qty;
                purchase.AmountPaid += item.Total;
                purchase.PaymentDate = DateTime.UtcNow;

                if (purchase.QuantityPaid < purchase.Quantity)
                {
                    purchase.PaymentStatus = "Half";

                    results.Add(new ReceiptMatchResult
                    {
                        Upc = item.Upc,
                        Result = "Half",
                        PurchaseId = purchase.Id,
                        QuantityPaid = purchase.QuantityPaid,
                        AmountPaid = purchase.AmountPaid
                    });
                }
                else if (NearlyEqual(purchase.AmountPaid, expectedSellPrice))
                {
                    purchase.PaymentStatus = "Paid";
                    purchase.DeliveryStatus = "Delivered";

                    results.Add(new ReceiptMatchResult
                    {
                        Upc = item.Upc,
                        Result = "Paid",
                        PurchaseId = purchase.Id,
                        QuantityPaid = purchase.QuantityPaid,
                        AmountPaid = purchase.AmountPaid
                    });
                }
                else
                {
                    purchase.PaymentStatus = "Issue";

                    results.Add(new ReceiptMatchResult
                    {
                        Upc = item.Upc,
                        Result = "Issue",
                        PurchaseId = purchase.Id,
                        ExpectedSellPrice = expectedSellPrice,
                        AmountPaid = purchase.AmountPaid
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        return results;
    }

    private static string NormalizeDigits(string value) =>
        new string((value ?? string.Empty).Where(char.IsDigit).ToArray());

    private static bool NearlyEqual(decimal a, decimal b, decimal epsilon = 0.01m) =>
        Math.Abs(a - b) < epsilon;
}
