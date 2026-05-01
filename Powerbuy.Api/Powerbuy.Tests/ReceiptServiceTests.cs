using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using Powerbuy.Api.Dtos;
using Powerbuy.Api.Models;
using Powerbuy.Api.Services;

namespace Powerbuy.Tests;

public class ReceiptServiceTests
{
    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task ProcessReceipt_FullMatchFromNotPaid_MarksPurchasePaid()
    {
        using var context = CreateDbContext();

        context.Purchases.Add(new Purchase
        {
            Id = 1,
            Item = "Test Item",
            Upc = "123456789012",
            Quantity = 3,
            QuantityPaid = 0,
            AmountPaid = 0,
            SellPrice = 300,
            PaymentStatus = "Not Paid",
            DeliveryStatus = "Not Delivered",
            TotalAmazon = 250,
            Model = "TEST",
            CardUsed = "Prime",
            BoughtFrom = "Amazon",
            OrderPlaced = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddDays(7),
            UserId = "user-1"
        });

        await context.SaveChangesAsync();

        var service = new ReceiptService(context);

        var request = new ReceiptProcessRequest
        {
            Items =
            {
                new ReceiptItemDto
                {
                    Upc = "123456789012",
                    Qty = 3,
                    UnitPrice = 100,
                    Total = 300
                }
            }
        };

        await service.ProcessReceiptAsync(request, "user-1");

        var purchase = await context.Purchases.FindAsync(1);

        Assert.NotNull(purchase);
        Assert.Equal("Paid", purchase!.PaymentStatus);
        Assert.Equal(3, purchase.QuantityPaid);
        Assert.Equal(300, purchase.AmountPaid);
        Assert.NotNull(purchase.PaymentDate);
    }

    [Fact]
    public async Task ProcessReceipt_PartialMatchFromNotPaid_MarksPurchaseHalf()
    {
        using var context = CreateDbContext();

        context.Purchases.Add(new Purchase
        {
            Id = 1,
            Item = "Test Item",
            Upc = "999999999999",
            Quantity = 5,
            QuantityPaid = 0,
            AmountPaid = 0,
            SellPrice = 500,
            PaymentStatus = "Not Paid",
            DeliveryStatus = "Not Delivered",
            TotalAmazon = 400,
            Model = "TEST",
            CardUsed = "Prime",
            BoughtFrom = "Amazon",
            OrderPlaced = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddDays(7),
            UserId = "user-1"
        });

        await context.SaveChangesAsync();

        var service = new ReceiptService(context);

        var request = new ReceiptProcessRequest
        {
            Items =
            {
                new ReceiptItemDto
                {
                    Upc = "999999999999",
                    Qty = 2,
                    UnitPrice = 100,
                    Total = 200
                }
            }
        };

        await service.ProcessReceiptAsync(request, "user-1");

        var purchase = await context.Purchases.FindAsync(1);

        Assert.NotNull(purchase);
        Assert.Equal("Half", purchase!.PaymentStatus);
        Assert.Equal(2, purchase.QuantityPaid);
        Assert.Equal(200, purchase.AmountPaid);
        Assert.NotNull(purchase.PaymentDate);
    }

    [Fact]
    public async Task ProcessReceipt_SecondPartialCompletesQuantityAndTotal_MarksPurchasePaid()
    {
        using var context = CreateDbContext();

        context.Purchases.Add(new Purchase
        {
            Id = 1,
            Item = "Test Item",
            Upc = "555555555555",
            Quantity = 5,
            QuantityPaid = 2,
            AmountPaid = 200,
            SellPrice = 500,
            PaymentStatus = "Half",
            DeliveryStatus = "Not Delivered",
            TotalAmazon = 400,
            Model = "TEST",
            CardUsed = "Prime",
            BoughtFrom = "Amazon",
            OrderPlaced = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddDays(7),
            UserId = "user-1"
        });

        await context.SaveChangesAsync();

        var service = new ReceiptService(context);

        var request = new ReceiptProcessRequest
        {
            Items =
            {
                new ReceiptItemDto
                {
                    Upc = "555555555555",
                    Qty = 3,
                    UnitPrice = 100,
                    Total = 300
                }
            }
        };

        await service.ProcessReceiptAsync(request, "user-1");

        var purchase = await context.Purchases.FindAsync(1);

        Assert.NotNull(purchase);
        Assert.Equal("Paid", purchase!.PaymentStatus);
        Assert.Equal(5, purchase.QuantityPaid);
        Assert.Equal(500, purchase.AmountPaid);
    }

    [Fact]
    public async Task ProcessReceipt_FullQuantityButWrongTotal_MarksPurchaseIssue()
    {
        using var context = CreateDbContext();

        context.Purchases.Add(new Purchase
        {
            Id = 1,
            Item = "Test Item",
            Upc = "222222222222",
            Quantity = 3,
            QuantityPaid = 0,
            AmountPaid = 0,
            SellPrice = 300,
            PaymentStatus = "Not Paid",
            DeliveryStatus = "Not Delivered",
            TotalAmazon = 250,
            Model = "TEST",
            CardUsed = "Prime",
            BoughtFrom = "Amazon",
            OrderPlaced = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddDays(7),
            UserId = "user-1"
        });

        await context.SaveChangesAsync();

        var service = new ReceiptService(context);

        var request = new ReceiptProcessRequest
        {
            Items =
            {
                new ReceiptItemDto
                {
                    Upc = "222222222222",
                    Qty = 3,
                    UnitPrice = 90,
                    Total = 270
                }
            }
        };

        await service.ProcessReceiptAsync(request, "user-1");

        var purchase = await context.Purchases.FindAsync(1);

        Assert.NotNull(purchase);
        Assert.Equal("Issue", purchase!.PaymentStatus);
        Assert.Equal(3, purchase.QuantityPaid);
        Assert.Equal(270, purchase.AmountPaid);
    }
}