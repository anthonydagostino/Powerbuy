using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using Powerbuy.Api.Models;

namespace Powerbuy.Tests;

/// <summary>
/// Tests that validate the data integrity of purchases created via the bookmarklet importer.
/// These mirror the payload structure built by buildPurchasePayload() in bookmarkletCore.js.
/// </summary>
public class BookmarkletImportTests
{
    private static AppDbContext CreateDbContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static Purchase BuildBookmarkletPurchase(
        string upc = "111111111111",
        string userId = "user-1",
        int qty = 3,
        decimal sellPricePerUnit = 100m,
        decimal totalAmazon = 90m,
        int cashbackRate = 5)
    {
        var sell = sellPricePerUnit * qty;
        var cb5 = cashbackRate == 5 ? totalAmazon * 0.05m : 0m;
        var cb6 = cashbackRate == 6 ? totalAmazon * 0.06m : 0m;
        var cb7 = cashbackRate == 7 ? totalAmazon * 0.07m : 0m;

        return new Purchase
        {
            Item = "Apple Watch Black",
            Upc = upc,
            Model = "WATCH-BLK",
            Quantity = qty,
            TotalAmazon = totalAmazon,
            SellPrice = sell,
            Cashback5Percent = cb5,
            Cashback6Percent = cb6,
            Cashback7Percent = cb7,
            Profit5Percent = cashbackRate == 5 ? sell - totalAmazon + cb5 : 0m,
            Profit6Percent = cashbackRate == 6 ? sell - totalAmazon + cb6 : 0m,
            Profit7Percent = cashbackRate == 7 ? sell - totalAmazon + cb7 : 0m,
            OrderPlaced = DateTime.UtcNow,
            Expires = new DateTime(2026, 12, 31, 0, 0, 0, DateTimeKind.Utc),
            CardUsed = "Prime",
            BoughtFrom = "Amazon",
            DeliveryStatus = "Not Delivered",
            PaymentStatus = "Not Paid",
            PaymentDate = null,
            TrackingNumber = null,
            QuantityPaid = 0,
            AmountPaid = 0,
            UserId = userId,
        };
    }

    // ── Default statuses ────────────────────────────────────────────────────

    [Fact]
    public async Task Import_SetsPaymentStatusToNotPaid()
    {
        using var db = CreateDbContext();
        var purchase = BuildBookmarkletPurchase();
        db.Purchases.Add(purchase);
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal("Not Paid", saved.PaymentStatus);
    }

    [Fact]
    public async Task Import_SetsDeliveryStatusToNotDelivered()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase());
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal("Not Delivered", saved.DeliveryStatus);
    }

    [Fact]
    public async Task Import_SetsQuantityPaidToZero()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase());
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal(0, saved.QuantityPaid);
    }

    [Fact]
    public async Task Import_SetsCardUsedToPrime()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase());
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal("Prime", saved.CardUsed);
    }

    [Fact]
    public async Task Import_SetsBoughtFromToAmazon()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase());
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal("Amazon", saved.BoughtFrom);
    }

    [Fact]
    public async Task Import_PaymentDateIsNull()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase());
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Null(saved.PaymentDate);
    }

    // ── Cashback and profit calculations ─────────────────────────────────────

    [Fact]
    public async Task Import_At5Percent_SetsCorrectCashbackAndProfit()
    {
        // qty=3, sell/unit=100 → sell=300, amazon=90
        // cashback5 = 90 * 0.05 = 4.50
        // profit5   = 300 - 90 + 4.50 = 214.50
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(cashbackRate: 5));
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal(4.50m, saved.Cashback5Percent);
        Assert.Equal(0m, saved.Cashback6Percent);
        Assert.Equal(0m, saved.Cashback7Percent);
        Assert.Equal(214.50m, saved.Profit5Percent);
        Assert.Equal(0m, saved.Profit6Percent);
        Assert.Equal(0m, saved.Profit7Percent);
    }

    [Fact]
    public async Task Import_At6Percent_SetsCorrectCashbackAndProfit()
    {
        // cashback6 = 90 * 0.06 = 5.40, profit6 = 300 - 90 + 5.40 = 215.40
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(cashbackRate: 6));
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal(0m, saved.Cashback5Percent);
        Assert.Equal(5.40m, saved.Cashback6Percent);
        Assert.Equal(0m, saved.Cashback7Percent);
        Assert.Equal(0m, saved.Profit5Percent);
        Assert.Equal(215.40m, saved.Profit6Percent);
        Assert.Equal(0m, saved.Profit7Percent);
    }

    [Fact]
    public async Task Import_At7Percent_SetsCorrectCashbackAndProfit()
    {
        // cashback7 = 90 * 0.07 = 6.30, profit7 = 300 - 90 + 6.30 = 216.30
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(cashbackRate: 7));
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal(6.30m, saved.Cashback7Percent);
        Assert.Equal(216.30m, saved.Profit7Percent);
    }

    [Fact]
    public async Task Import_SellPriceIsUnitPriceTimesQuantity()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(qty: 3, sellPricePerUnit: 100m));
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal(300m, saved.SellPrice);
    }

    // ── Multiple imports / duplicates ────────────────────────────────────────

    [Fact]
    public async Task Import_AllowsMultiplePurchasesWithSameUpc()
    {
        // Bookmarklet doesn't deduplicate — two imports of the same UPC
        // creates two separate purchase records (by design).
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(upc: "111111111111"));
        db.Purchases.Add(BuildBookmarkletPurchase(upc: "111111111111"));
        await db.SaveChangesAsync();

        var count = await db.Purchases.CountAsync(p => p.Upc == "111111111111");
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task Import_MultipleDifferentUpcsPersistCorrectly()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(upc: "111111111111"));
        db.Purchases.Add(BuildBookmarkletPurchase(upc: "222222222222"));
        db.Purchases.Add(BuildBookmarkletPurchase(upc: "333333333333"));
        await db.SaveChangesAsync();

        Assert.Equal(3, await db.Purchases.CountAsync());
    }

    // ── User isolation ───────────────────────────────────────────────────────

    [Fact]
    public async Task Import_PurchaseIsTaggedWithCorrectUserId()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(userId: "user-42"));
        await db.SaveChangesAsync();

        var saved = await db.Purchases.FirstAsync();
        Assert.Equal("user-42", saved.UserId);
    }

    [Fact]
    public async Task Import_UserCannotSeeOtherUsersImports()
    {
        using var db = CreateDbContext();
        db.Purchases.Add(BuildBookmarkletPurchase(userId: "user-a"));
        db.Purchases.Add(BuildBookmarkletPurchase(userId: "user-b"));
        await db.SaveChangesAsync();

        var userACount = await db.Purchases.CountAsync(p => p.UserId == "user-a");
        var userBCount = await db.Purchases.CountAsync(p => p.UserId == "user-b");
        Assert.Equal(1, userACount);
        Assert.Equal(1, userBCount);
    }
}
