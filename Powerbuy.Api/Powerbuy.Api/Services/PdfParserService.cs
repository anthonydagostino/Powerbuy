using System.Text;
using System.Text.RegularExpressions;
using Powerbuy.Api.Dtos;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace Powerbuy.Api.Services;

public class PdfParserService
{
    public string ExtractText(byte[] pdfBytes)
    {
        using var document = PdfDocument.Open(pdfBytes);
        var sb = new StringBuilder();
        foreach (var page in document.GetPages())
            sb.AppendLine(ContentOrderTextExtractor.GetText(page));
        return sb.ToString();
    }

    public List<ReceiptItemDto> ParseReceiptItems(string text)
    {
        // Normalize whitespace exactly like the Apps Script
        var normalized = Regex.Replace(text, @"\r|\n", " ");
        normalized = Regex.Replace(normalized, @"[ \t]+", " ").Trim();

        // Find the table header row
        var headerMatch = Regex.Match(normalized, @"TITLE\s+UPC\s+QTY\s+PRICE\s+COMMI\w*\s+TOTAL", RegexOptions.IgnoreCase);
        if (!headerMatch.Success)
            return new List<ReceiptItemDto>();

        var tableText = normalized[(headerMatch.Index + headerMatch.Length)..].Trim();

        var items = new List<ReceiptItemDto>();
        var rowRegex = new Regex(
            @"(\d+)\s+([A-Z0-9\-\/\[\]\. ]+?)\s+(\d{10,15})\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})");

        foreach (Match match in rowRegex.Matches(tableText))
        {
            var title = match.Groups[2].Value.Trim();
            var upc = match.Groups[3].Value.Trim();
            var unitPrice = ParseMoney(match.Groups[4].Value);
            var total = ParseMoney(match.Groups[6].Value);

            if (Regex.IsMatch(title, @"TBA TRACKING|SERIALS", RegexOptions.IgnoreCase))
                continue;

            if (unitPrice == 0 || total == 0)
                continue;

            var qty = (int)Math.Round(total / unitPrice);

            // OCR sometimes appends the qty digit onto the end of the UPC
            if (upc.Length >= 13 && upc.EndsWith(qty.ToString()))
                upc = upc[..^1];

            items.Add(new ReceiptItemDto
            {
                Upc = upc,
                Qty = qty,
                UnitPrice = unitPrice,
                Total = total
            });
        }

        return items;
    }

    private static decimal ParseMoney(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        return decimal.TryParse(value.Replace(",", "").Trim(),
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out var result) ? result : 0;
    }
}
