using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Powerbuy.Api.Dtos;
using Powerbuy.Api.Services;
using System.Security.Claims;

namespace Powerbuy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReceiptsController : ControllerBase
{
    private readonly ReceiptService _receiptService;
    private readonly PdfParserService _pdfParserService;

    public ReceiptsController(ReceiptService receiptService, PdfParserService pdfParserService)
    {
        _receiptService = receiptService;
        _pdfParserService = pdfParserService;
    }

    [HttpPost("process")]
    public async Task<IActionResult> ProcessReceipt(ReceiptProcessRequest request)
    {
        var results = await _receiptService.ProcessReceiptAsync(request, GetUserId());
        return Ok(results);
    }

    [HttpPost("debug-pdf-text")]
    public async Task<IActionResult> DebugPdfText(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        try
        {
            var text = _pdfParserService.ExtractText(ms.ToArray());
            return Ok(new { text });
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to read PDF: {ex.Message}");
        }
    }

    [HttpPost("upload-pdf")]
    public async Task<IActionResult> UploadPdf(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be a PDF.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        string text;
        try
        {
            text = _pdfParserService.ExtractText(ms.ToArray());
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to read PDF: {ex.Message}");
        }

        var items = _pdfParserService.ParseReceiptItems(text);

        if (items.Count == 0)
            return BadRequest("No receipt items found in the PDF. Only digital (non-scanned) PDFs are supported.");

        var request = new ReceiptProcessRequest { Items = items };
        var results = await _receiptService.ProcessReceiptAsync(request, GetUserId());

        return Ok(new { itemsParsed = items.Count, results });
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User ID not found in token.");
}
