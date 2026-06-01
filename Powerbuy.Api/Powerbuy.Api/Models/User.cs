namespace Powerbuy.Api.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? GoogleRefreshToken { get; set; }

    public decimal NegativeBalance { get; set; } = 0;

    public decimal CurrentProfitBaseline { get; set; } = 0;

    public decimal ExpectedProfitBaseline { get; set; } = 0;

    public decimal? LastCashoutAmount { get; set; }

    public string? LastCashoutDate { get; set; }

    public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
}
