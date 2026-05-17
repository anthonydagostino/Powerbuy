using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using System.Security.Claims;

namespace Powerbuy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<UserSettingsResponse>> GetSettings()
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new UserSettingsResponse { NegativeBalance = user.NegativeBalance });
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(UserSettingsRequest request)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.NegativeBalance = request.NegativeBalance;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new InvalidOperationException("User ID not found in token.");
}

public class UserSettingsResponse
{
    public decimal NegativeBalance { get; set; }
}

public class UserSettingsRequest
{
    public decimal NegativeBalance { get; set; }
}
