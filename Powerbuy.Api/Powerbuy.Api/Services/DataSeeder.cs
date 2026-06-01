using Powerbuy.Api.Data;
using Powerbuy.Api.Models;

namespace Powerbuy.Api.Services;

public class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context, IConfiguration configuration)
    {
        try
        {
            if (!context.Database.CanConnect())
            {
                await context.Database.EnsureCreatedAsync();
            }

            if (!context.Users.Any())
            {
                var personalUserEmail = configuration["Seeding:Email"] ?? "you@example.com";
                var personalUserPassword = configuration["Seeding:Password"] ?? "ChangeMe123!";

                var personalUser = new User
                {
                    Email = personalUserEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(personalUserPassword)
                };

                context.Users.Add(personalUser);
                await context.SaveChangesAsync();

                var orphanedPurchases = context.Purchases
                    .Where(p => p.UserId == string.Empty || p.UserId == null)
                    .ToList();

                foreach (var purchase in orphanedPurchases)
                {
                    purchase.UserId = personalUser.Id;
                }

                await context.SaveChangesAsync();
            }

            // Restore known cashout data if it was lost
            var user = context.Users.FirstOrDefault(u => u.Email == "anthonysdagostino@gmail.com");
            if (user != null && user.LastCashoutAmount == null)
            {
                user.LastCashoutAmount = 1650;
                user.LastCashoutDate = "2026-05-15";
                user.CurrentProfitBaseline = 1650;
                user.ExpectedProfitBaseline = 1650;
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Seeding error: {ex.Message}");
        }
    }
}
