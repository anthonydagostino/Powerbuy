using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Powerbuy.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialCashoutData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""CurrentProfitBaseline"" = 1650,
                    ""ExpectedProfitBaseline"" = 1650,
                    ""LastCashoutAmount""      = 1650,
                    ""LastCashoutDate""        = '2026-05-15'
                WHERE ""Email"" = 'anthonysdagostino@gmail.com'
                  AND ""CurrentProfitBaseline"" = 0;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""CurrentProfitBaseline"" = 0,
                    ""ExpectedProfitBaseline"" = 0,
                    ""LastCashoutAmount""      = NULL,
                    ""LastCashoutDate""        = NULL
                WHERE ""Email"" = 'anthonysdagostino@gmail.com';
            ");
        }
    }
}
