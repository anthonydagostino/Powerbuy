using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using Powerbuy.Api.Models;

namespace Powerbuy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        var purchases = await _context.Purchases.ToListAsync();
        return Ok(purchases);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Purchase>> GetPurchase(int id)
    {
        var purchase = await _context.Purchases.FindAsync(id);

        if (purchase == null)
        {
            return NotFound();
        }

        return Ok(purchase);
    }

    [HttpPost]
    public async Task<ActionResult<Purchase>> CreatePurchase(Purchase purchase)
    {
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

        var existingPurchase = await _context.Purchases.FindAsync(id);

        if (existingPurchase == null)
        {
            return NotFound();
        }

        _context.Entry(existingPurchase).CurrentValues.SetValues(updatedPurchase);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePurchase(int id)
    {
        var purchase = await _context.Purchases.FindAsync(id);

        if (purchase == null)
        {
            return NotFound();
        }

        _context.Purchases.Remove(purchase);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}