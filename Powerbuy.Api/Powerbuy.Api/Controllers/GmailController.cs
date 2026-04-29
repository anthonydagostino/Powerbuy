using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Powerbuy.Api.Services;
using System.Security.Claims;

namespace Powerbuy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GmailController : ControllerBase
{
    private readonly GmailSyncService _gmailSyncService;
    private readonly ReceiptService _receiptService;
    private readonly PdfParserService _pdfParserService;
    private readonly IConfiguration _config;

    public GmailController(
        GmailSyncService gmailSyncService,
        ReceiptService receiptService,
        PdfParserService pdfParserService,
        IConfiguration config)
    {
        _gmailSyncService = gmailSyncService;
        _receiptService = receiptService;
        _pdfParserService = pdfParserService;
        _config = config;
    }

    [HttpGet("auth-url")]
    [Authorize]
    public IActionResult GetAuthUrl()
    {
        try
        {
            var url = _gmailSyncService.BuildAuthUrl(GetUserId());
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, ex.Message);
        }
    }

    // No [Authorize] — this is a browser redirect from Google, no JWT present
    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error)
    {
        var frontendUrl = _config["Google:FrontendUrl"] ?? "http://localhost:5173";

        if (!string.IsNullOrEmpty(error))
            return Redirect($"{frontendUrl}?gmailError={Uri.EscapeDataString(error)}");

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
            return Redirect($"{frontendUrl}?gmailError=missing_params");

        try
        {
            await _gmailSyncService.HandleCallbackAsync(code, state);
            return Redirect($"{frontendUrl}?gmailConnected=true");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontendUrl}?gmailError={Uri.EscapeDataString(ex.Message)}");
        }
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus()
    {
        var connected = await _gmailSyncService.IsConnectedAsync(GetUserId());
        return Ok(new { connected });
    }

    [HttpPost("process")]
    [Authorize]
    public async Task<IActionResult> ProcessReceipts()
    {
        try
        {
            var result = await _gmailSyncService.ProcessReceiptsAsync(
                GetUserId(), _receiptService, _pdfParserService);
            return Ok(result);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not connected"))
        {
            return BadRequest(new { error = "Gmail not connected." });
        }
    }

    [HttpPost("disconnect")]
    [Authorize]
    public async Task<IActionResult> Disconnect()
    {
        await _gmailSyncService.DisconnectAsync(GetUserId());
        return Ok();
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User ID not found in token.");
}
