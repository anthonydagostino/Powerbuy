using Powerbuy.Api.Data;
using Powerbuy.Api.Models;

namespace Powerbuy.Api.Services;

public class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context, IConfiguration configuration)
    {
        try
        {
            // Check if we've already migrated data
            if (!context.Database.CanConnect())
            {
                await context.Database.EnsureCreatedAsync();
            }

            // Only seed if Users table is empty
            if (context.Users.Any())
            {
                return; // Data already seeded
            }

            // Create your personal account if it doesn't exist
            var personalUserEmail = configuration["Seeding:Email"] ?? "you@example.com";
            var personalUserPassword = configuration["Seeding:Password"] ?? "ChangeMe123!";

            var personalUser = new User
            {
                Email = personalUserEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(personalUserPassword)
            };

            context.Users.Add(personalUser);
            await context.SaveChangesAsync();

            // Associate all existing purchases (that don't have a UserId) with this account
            var orphanedPurchases = context.Purchases
                .Where(p => p.UserId == string.Empty || p.UserId == null)
                .ToList();

            foreach (var purchase in orphanedPurchases)
            {
                purchase.UserId = personalUser.Id;
            }

            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Log seeding errors but don't crash the app
            Console.WriteLine($"Seeding error: {ex.Message}");
        }
    }
}
