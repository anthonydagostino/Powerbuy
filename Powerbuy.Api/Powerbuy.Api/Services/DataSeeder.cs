using Powerbuy.Api.Data;
using Powerbuy.Api.Models;

namespace Powerbuy.Api.Services;

public class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Check if we've already migrated data
        if (!context.Database.CanConnect())
        {
            await context.Database.EnsureCreatedAsync();
        }

        // Create your personal account if it doesn't exist
        var personalUserEmail = "you@example.com"; // Change this to your email
        var existingUser = context.Users.FirstOrDefault(u => u.Email == personalUserEmail);

        if (existingUser == null)
        {
            var personalUser = new User
            {
                Email = personalUserEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ChangeMe123!") // Change this password!
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
    }
}
