using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Data;

namespace Powerbuy.Api.Services;

public class GmailSyncBackgroundService : BackgroundService
{
    // Runs at 8:00 AM and 8:00 PM UTC
    private static readonly TimeOnly[] RunTimes =
    {
        new TimeOnly(8, 0),
        new TimeOnly(20, 0)
    };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<GmailSyncBackgroundService> _logger;

    public GmailSyncBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<GmailSyncBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = GetDelayUntilNextRun();
            _logger.LogInformation("Gmail auto-sync: next run in {Delay:hh\\:mm\\:ss}", delay);

            await Task.Delay(delay, stoppingToken);
            if (stoppingToken.IsCancellationRequested) break;

            await RunSyncForAllUsersAsync(stoppingToken);
        }
    }

    private async Task RunSyncForAllUsersAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var gmailSync = scope.ServiceProvider.GetRequiredService<GmailSyncService>();
        var receiptService = scope.ServiceProvider.GetRequiredService<ReceiptService>();
        var pdfParser = scope.ServiceProvider.GetRequiredService<PdfParserService>();

        var users = await context.Users
            .Where(u => u.GoogleRefreshToken != null)
            .ToListAsync(stoppingToken);

        foreach (var user in users)
        {
            try
            {
                var result = await gmailSync.ProcessReceiptsAsync(user.Id, receiptService, pdfParser);
                _logger.LogInformation(
                    "Gmail auto-sync: {Threads} thread(s) processed for user {UserId}",
                    result.ThreadsProcessed, user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gmail auto-sync: failed for user {UserId}", user.Id);
            }
        }
    }

    private static TimeSpan GetDelayUntilNextRun()
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var currentTime = TimeOnly.FromDateTime(now);

        foreach (var runTime in RunTimes.Order())
        {
            if (runTime > currentTime)
                return today.ToDateTime(runTime, DateTimeKind.Utc) - now;
        }

        // All slots today have passed — wait until first slot tomorrow
        var tomorrow = today.AddDays(1);
        return tomorrow.ToDateTime(RunTimes.Min(), DateTimeKind.Utc) - now;
    }
}
