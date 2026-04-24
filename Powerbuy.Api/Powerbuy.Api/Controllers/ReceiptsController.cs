using Microsoft.AspNetCore.Mvc;
using Powerbuy.Api.Dtos;
using Powerbuy.Api.Services;

namespace Powerbuy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly ReceiptService _receiptService;

    public ReceiptsController(ReceiptService receiptService)
    {
        _receiptService = receiptService;
    }

    [HttpPost("process")]
    public async Task<IActionResult> ProcessReceipt(ReceiptProcessRequest request)
    {
        var results = await _receiptService.ProcessReceiptAsync(request);
        return Ok(results);
    }
}