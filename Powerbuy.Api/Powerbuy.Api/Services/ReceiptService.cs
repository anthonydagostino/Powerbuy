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

    public async Task<List<object>> ProcessReceiptAsync(ReceiptProcessRequest request)
    {
        var results = new List<object>();

        foreach (var item in request.Items)
        {
            var normalizedUpc = NormalizeDigits(item.Upc);

            var candidatePurchases = await _context.Purchases
                .Where(p => p.PaymentStatus == "Not Paid" || p.PaymentStatus == "Half")
                .ToListAsync();

            var purchase = candidatePurchases
                .Where(p => NormalizeDigits(p.Upc) == normalizedUpc)
                .OrderBy(p => p.Id)
                .FirstOrDefault(p => p.QuantityPaid < p.Quantity);

            if (purchase == null)
            {
                results.Add(new
                {
                    item.Upc,
                    item.Qty,
                    item.Total,
                    result = "No Match"
                });

                continue;
            }

            var expectedSellPrice = purchase.SellPrice;

            if (purchase.PaymentStatus == "Not Paid")
            {
                if (purchase.Quantity == item.Qty && NearlyEqual(expectedSellPrice, item.Total))
                {
                    purchase.PaymentStatus = "Paid";
                    purchase.PaymentDate = DateTime.UtcNow;
                    purchase.QuantityPaid = item.Qty;
                    purchase.AmountPaid = item.Total;

                    results.Add(new
                    {
                        item.Upc,
                        result = "Paid",
                        purchase.Id,
                        quantityPaid = purchase.QuantityPaid,
                        amountPaid = purchase.AmountPaid
                    });
                }
                else if (purchase.Quantity != item.Qty)
                {
                    purchase.PaymentStatus = "Half";
                    purchase.PaymentDate = DateTime.UtcNow;
                    purchase.QuantityPaid = item.Qty;
                    purchase.AmountPaid = item.Total;

                    results.Add(new
                    {
                        item.Upc,
                        result = "Half",
                        purchase.Id,
                        quantityPaid = purchase.QuantityPaid,
                        amountPaid = purchase.AmountPaid
                    });
                }
                else
                {
                    purchase.PaymentStatus = "Issue";
                    purchase.PaymentDate = DateTime.UtcNow;
                    purchase.QuantityPaid = item.Qty;
                    purchase.AmountPaid = item.Total;

                    results.Add(new
                    {
                        item.Upc,
                        result = "Issue",
                        purchase.Id,
                        expectedSellPrice,
                        amountPaid = purchase.AmountPaid
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

                    results.Add(new
                    {
                        item.Upc,
                        result = "Half",
                        purchase.Id,
                        quantityPaid = purchase.QuantityPaid,
                        amountPaid = purchase.AmountPaid
                    });
                }
                else
                {
                    if (NearlyEqual(purchase.AmountPaid, expectedSellPrice))
                    {
                        purchase.PaymentStatus = "Paid";

                        results.Add(new
                        {
                            item.Upc,
                            result = "Paid",
                            purchase.Id,
                            quantityPaid = purchase.QuantityPaid,
                            amountPaid = purchase.AmountPaid
                        });
                    }
                    else
                    {
                        purchase.PaymentStatus = "Issue";

                        results.Add(new
                        {
                            item.Upc,
                            result = "Issue",
                            purchase.Id,
                            expectedSellPrice,
                            amountPaid = purchase.AmountPaid
                        });
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        return results;
    }

    private static string NormalizeDigits(string value)
    {
        return new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
    }

    private static bool NearlyEqual(decimal a, decimal b, decimal epsilon = 0.01m)
    {
        return Math.Abs(a - b) < epsilon;
    }
}