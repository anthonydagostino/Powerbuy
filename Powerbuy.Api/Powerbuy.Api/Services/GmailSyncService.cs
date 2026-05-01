using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;
using Powerbuy.Api.Dtos;

namespace Powerbuy.Api.Services;

public class GmailSyncService
{
    private const string GmailQuery =
        "subject:\"Enclosed is your RECEIPT\" has:attachment -label:powerbuy-processed-app";

    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public GmailSyncService(AppDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    // ===== OAUTH =====

    public string BuildAuthUrl(string userId)
    {
        var clientId = _config["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId is not configured.");
        var redirectUri = _config["Google:RedirectUri"]
            ?? throw new InvalidOperationException("Google:RedirectUri is not configured.");

        var state = CreateStateToken(userId);
        var scope = "https://www.googleapis.com/auth/gmail.modify";

        return "https://accounts.google.com/o/oauth2/v2/auth" +
               $"?client_id={Uri.EscapeDataString(clientId)}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&response_type=code" +
               $"&scope={Uri.EscapeDataString(scope)}" +
               $"&access_type=offline" +
               $"&prompt=consent" +
               $"&state={Uri.EscapeDataString(state)}";
    }

    public async Task HandleCallbackAsync(string code, string state)
    {
        var userId = ValidateStateToken(state)
            ?? throw new InvalidOperationException("Invalid or expired OAuth state.");

        var clientId = _config["Google:ClientId"]!;
        var clientSecret = _config["Google:ClientSecret"]!;
        var redirectUri = _config["Google:RedirectUri"]!;

        var http = _httpClientFactory.CreateClient();
        var resp = await http.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            }));

        resp.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;
        var refreshToken = json.GetProperty("refresh_token").GetString()
            ?? throw new InvalidOperationException("No refresh_token in response. Ensure access_type=offline and prompt=consent.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("User not found.");
        user.GoogleRefreshToken = refreshToken;
        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsConnectedAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        return !string.IsNullOrEmpty(user?.GoogleRefreshToken);
    }

    public async Task DisconnectAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;
        user.GoogleRefreshToken = null;
        await _context.SaveChangesAsync();
    }

    // ===== MAIN PROCESS =====

    public async Task<GmailSyncResult> ProcessReceiptsAsync(
        string userId,
        ReceiptService receiptService,
        PdfParserService pdfParserService,
        int days = 3)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("User not found.");

        if (string.IsNullOrEmpty(user.GoogleRefreshToken))
            throw new InvalidOperationException("Gmail not connected.");

        var accessToken = await RefreshAccessTokenAsync(user.GoogleRefreshToken);
        var http = _httpClientFactory.CreateClient();

        var processedLabelId = await GetOrCreateLabelAsync(http, accessToken, "powerbuy-processed-app");
        var halfLabelId = await GetOrCreateLabelAsync(http, accessToken, "powerbuy-half-app");
        var issueLabelId = await GetOrCreateLabelAsync(http, accessToken, "powerbuy-issue-app");

        var afterDate = DateTime.UtcNow.AddDays(-days).ToString("yyyy/MM/dd");
        var query = $"{GmailQuery} after:{afterDate}";
        var threadIds = await ListThreadIdsAsync(http, accessToken, query, 50);

        var allResults = new List<ReceiptMatchResult>();
        var threadsProcessed = 0;

        foreach (var threadId in threadIds)
        {
            var messageIds = await GetThreadMessageIdsAsync(http, accessToken, threadId);
            bool foundPaid = false, foundHalf = false, foundIssue = false;

            foreach (var messageId in messageIds)
            {
                var pdfAttachments = await GetPdfAttachmentsAsync(http, accessToken, messageId);

                foreach (var (_, attachmentId) in pdfAttachments)
                {
                    var pdfBytes = await GetAttachmentBytesAsync(http, accessToken, messageId, attachmentId);

                    string text;
                    try { text = pdfParserService.ExtractText(pdfBytes); }
                    catch { continue; }

                    var items = pdfParserService.ParseReceiptItems(text);
                    if (items.Count == 0) continue;

                    var results = await receiptService.ProcessReceiptAsync(
                        new ReceiptProcessRequest { Items = items }, userId);

                    foreach (var r in results)
                    {
                        if (r.Result == "Paid") foundPaid = true;
                        if (r.Result == "Half") foundHalf = true;
                        if (r.Result == "Issue") foundIssue = true;
                    }

                    allResults.AddRange(results);
                }
            }

            if (foundPaid || foundHalf || foundIssue)
            {
                var labelsToAdd = new List<string> { processedLabelId };
                if (foundHalf) labelsToAdd.Add(halfLabelId);
                if (foundIssue) labelsToAdd.Add(issueLabelId);
                await AddLabelsToThreadAsync(http, accessToken, threadId, labelsToAdd);
                threadsProcessed++;
            }
        }

        return new GmailSyncResult
        {
            ThreadsFound = threadIds.Count,
            ThreadsProcessed = threadsProcessed,
            Results = allResults
        };
    }

    // ===== GMAIL REST HELPERS =====

    private async Task<string> RefreshAccessTokenAsync(string refreshToken)
    {
        var http = _httpClientFactory.CreateClient();
        var resp = await http.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["refresh_token"] = refreshToken,
                ["client_id"] = _config["Google:ClientId"]!,
                ["client_secret"] = _config["Google:ClientSecret"]!,
                ["grant_type"] = "refresh_token"
            }));
        resp.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;
        return json.GetProperty("access_token").GetString()!;
    }

    private static async Task<List<string>> ListThreadIdsAsync(
        HttpClient http, string accessToken, string query, int maxResults)
    {
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/threads" +
                  $"?q={Uri.EscapeDataString(query)}&maxResults={maxResults}";
        var json = await GmailGetAsync(http, accessToken, url);

        if (!json.TryGetProperty("threads", out var threads))
            return new List<string>();

        return threads.EnumerateArray()
            .Select(t => t.GetProperty("id").GetString()!)
            .ToList();
    }

    private static async Task<List<string>> GetThreadMessageIdsAsync(
        HttpClient http, string accessToken, string threadId)
    {
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/threads/{threadId}?format=metadata";
        var json = await GmailGetAsync(http, accessToken, url);

        return json.GetProperty("messages").EnumerateArray()
            .Select(m => m.GetProperty("id").GetString()!)
            .ToList();
    }

    private static async Task<List<(string filename, string attachmentId)>> GetPdfAttachmentsAsync(
        HttpClient http, string accessToken, string messageId)
    {
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}?format=full";
        var json = await GmailGetAsync(http, accessToken, url);

        var parts = new List<(string, string)>();
        if (json.TryGetProperty("payload", out var payload))
            CollectPdfParts(payload, parts);
        return parts;
    }

    private static void CollectPdfParts(JsonElement part, List<(string, string)> results)
    {
        if (part.TryGetProperty("parts", out var children))
            foreach (var child in children.EnumerateArray())
                CollectPdfParts(child, results);

        var mimeType = part.TryGetProperty("mimeType", out var mt) ? mt.GetString() ?? "" : "";
        var filename = part.TryGetProperty("filename", out var fn) ? fn.GetString() ?? "" : "";
        var isPdf = mimeType == "application/pdf" ||
                    filename.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);
        if (!isPdf) return;

        if (!part.TryGetProperty("body", out var body)) return;
        if (!body.TryGetProperty("attachmentId", out var aid)) return;
        var attachmentId = aid.GetString();
        if (!string.IsNullOrEmpty(attachmentId))
            results.Add((filename, attachmentId));
    }

    private static async Task<byte[]> GetAttachmentBytesAsync(
        HttpClient http, string accessToken, string messageId, string attachmentId)
    {
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}/attachments/{attachmentId}";
        var json = await GmailGetAsync(http, accessToken, url);

        // Gmail uses base64url encoding
        var data = json.GetProperty("data").GetString()!;
        var base64 = data.Replace('-', '+').Replace('_', '/');
        base64 = (base64.Length % 4) switch
        {
            2 => base64 + "==",
            3 => base64 + "=",
            _ => base64
        };
        return Convert.FromBase64String(base64);
    }

    private static async Task<string> GetOrCreateLabelAsync(
        HttpClient http, string accessToken, string labelName)
    {
        var json = await GmailGetAsync(http, accessToken,
            "https://gmail.googleapis.com/gmail/v1/users/me/labels");

        foreach (var label in json.GetProperty("labels").EnumerateArray())
        {
            if (label.GetProperty("name").GetString() == labelName)
                return label.GetProperty("id").GetString()!;
        }

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://gmail.googleapis.com/gmail/v1/users/me/labels");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        req.Content = new StringContent(
            JsonSerializer.Serialize(new { name = labelName }), Encoding.UTF8, "application/json");

        var resp = await http.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var created = JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;
        return created.GetProperty("id").GetString()!;
    }

    private static async Task AddLabelsToThreadAsync(
        HttpClient http, string accessToken, string threadId, List<string> labelIds)
    {
        var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://gmail.googleapis.com/gmail/v1/users/me/threads/{threadId}/modify");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        req.Content = new StringContent(
            JsonSerializer.Serialize(new { addLabelIds = labelIds }), Encoding.UTF8, "application/json");
        var resp = await http.SendAsync(req);
        resp.EnsureSuccessStatusCode();
    }

    private static async Task<JsonElement> GmailGetAsync(HttpClient http, string accessToken, string url)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var resp = await http.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        return JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;
    }

    // ===== STATELESS SIGNED STATE TOKEN =====

    private string CreateStateToken(string userId)
    {
        var expiry = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds();
        var payload = $"{userId}:{expiry}";
        var token = $"{payload}:{Sign(payload)}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(token))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    private string? ValidateStateToken(string state)
    {
        try
        {
            var padded = state.Replace('-', '+').Replace('_', '/');
            padded = (padded.Length % 4) switch { 2 => padded + "==", 3 => padded + "=", _ => padded };
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(padded));

            var lastColon = decoded.LastIndexOf(':');
            if (lastColon < 0) return null;

            var payload = decoded[..lastColon];
            var sig = decoded[(lastColon + 1)..];
            if (Sign(payload) != sig) return null;

            var colonIdx = payload.IndexOf(':');
            var userId = payload[..colonIdx];
            var expiry = long.Parse(payload[(colonIdx + 1)..]);

            return DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiry ? null : userId;
        }
        catch { return null; }
    }

    private string Sign(string payload)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? "fallback-key");
        using var hmac = new HMACSHA256(key);
        return Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
    }
}

public class GmailSyncResult
{
    public int ThreadsFound { get; set; }
    public int ThreadsProcessed { get; set; }
    public List<ReceiptMatchResult> Results { get; set; } = new();
}
