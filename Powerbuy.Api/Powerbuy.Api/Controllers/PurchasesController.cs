using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using Powerbuy.Api.Models;
using System.Security.Claims;

namespace Powerbuy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchasesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PurchasesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Purchase>>> GetPurchases()
    {
        var currentUserId = GetUserId();

        var purchases = await _context.Purchases
            .Where(p => p.UserId == currentUserId)
            .ToListAsync();

        return Ok(purchases);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Purchase>> GetPurchase(int id)
    {
        var currentUserId = GetUserId();

        var purchase = await _context.Purchases
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == currentUserId);

        if (purchase == null)
        {
            return NotFound();
        }

        return Ok(purchase);
    }

    [HttpPost]
    public async Task<ActionResult<Purchase>> CreatePurchase(Purchase purchase)
    {
        purchase.UserId = GetUserId();

        _context.Purchases.Add(purchase);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPurchase), new { id = purchase.Id }, purchase);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePurchase(int id, Purchase updatedPurchase)
    {
        if (id != updatedPurchase.Id)
        {
            return BadRequest("Purchase ID mismatch.");
        }

        var currentUserId = GetUserId();

        var existingPurchase = await _context.Purchases
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == currentUserId);

        if (existingPurchase == null)
        {
            return NotFound();
        }

        existingPurchase.Item = updatedPurchase.Item;
        existingPurchase.TotalAmazon = updatedPurchase.TotalAmazon;
        existingPurchase.SellPrice = updatedPurchase.SellPrice;
        existingPurchase.Cashback5Percent = updatedPurchase.Cashback5Percent;
        existingPurchase.Cashback6Percent = updatedPurchase.Cashback6Percent;
        existingPurchase.Cashback7Percent = updatedPurchase.Cashback7Percent;
        existingPurchase.Profit5Percent = updatedPurchase.Profit5Percent;
        existingPurchase.Profit6Percent = updatedPurchase.Profit6Percent;
        existingPurchase.Profit7Percent = updatedPurchase.Profit7Percent;
        existingPurchase.OrderPlaced = updatedPurchase.OrderPlaced;
        existingPurchase.Quantity = updatedPurchase.Quantity;
        existingPurchase.Expires = updatedPurchase.Expires;
        existingPurchase.Upc = updatedPurchase.Upc;
        existingPurchase.Model = updatedPurchase.Model;
        existingPurchase.CardUsed = updatedPurchase.CardUsed;
        existingPurchase.BoughtFrom = updatedPurchase.BoughtFrom;
        existingPurchase.DeliveryStatus = updatedPurchase.DeliveryStatus;
        existingPurchase.PaymentStatus = updatedPurchase.PaymentStatus;
        existingPurchase.PaymentDate = updatedPurchase.PaymentDate;
        existingPurchase.TrackingNumber = updatedPurchase.TrackingNumber;
        existingPurchase.QuantityPaid = updatedPurchase.QuantityPaid;
        existingPurchase.AmountPaid = updatedPurchase.AmountPaid;
        // UserId stays as existingPurchase.UserId — don't let the client overwrite it

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePurchase(int id)
    {
        var currentUserId = GetUserId();

        var purchase = await _context.Purchases
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == currentUserId);

        if (purchase == null)
        {
            return NotFound();
        }

        _context.Purchases.Remove(purchase);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new InvalidOperationException("User ID not found in token.");
    }
}