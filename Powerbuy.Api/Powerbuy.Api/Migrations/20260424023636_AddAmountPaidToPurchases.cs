using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Powerbuy.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAmountPaidToPurchases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AmountPaid",
                table: "Purchases",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmountPaid",
                table: "Purchases");
        }
    }
}
