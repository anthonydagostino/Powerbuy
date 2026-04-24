using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Powerbuy.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Purchases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Item = table.Column<string>(type: "text", nullable: false),
                    TotalAmazon = table.Column<decimal>(type: "numeric", nullable: false),
                    SellPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Cashback5Percent = table.Column<decimal>(type: "numeric", nullable: false),
                    Cashback6Percent = table.Column<decimal>(type: "numeric", nullable: false),
                    Cashback7Percent = table.Column<decimal>(type: "numeric", nullable: false),
                    Profit5Percent = table.Column<decimal>(type: "numeric", nullable: false),
                    Profit6Percent = table.Column<decimal>(type: "numeric", nullable: false),
                    Profit7Percent = table.Column<decimal>(type: "numeric", nullable: false),
                    OrderPlaced = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Upc = table.Column<string>(type: "text", nullable: false),
                    Model = table.Column<string>(type: "text", nullable: false),
                    CardUsed = table.Column<string>(type: "text", nullable: false),
                    BoughtFrom = table.Column<string>(type: "text", nullable: false),
                    DeliveryStatus = table.Column<string>(type: "text", nullable: false),
                    PaymentStatus = table.Column<string>(type: "text", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TrackingNumber = table.Column<string>(type: "text", nullable: true),
                    QuantityPaid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Purchases", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Purchases");
        }
    }
}
