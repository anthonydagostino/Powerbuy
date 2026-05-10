using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Powerbuy.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReceiptEmailDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReceiptEmailDate",
                table: "Purchases",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiptEmailDate",
                table: "Purchases");
        }
    }
}
