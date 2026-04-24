using Microsoft.EntityFrameworkCore;
using Powerbuy.Api.Models;

namespace Powerbuy.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Purchase> Purchases => Set<Purchase>();
}