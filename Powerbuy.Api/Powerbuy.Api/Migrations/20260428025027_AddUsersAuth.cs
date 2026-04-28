using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Powerbuy.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUsersAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            // =========================================================================
            // CUSTOM SQL: Fix for existing Purchases before the Foreign Key is applied
            // =========================================================================

            // 1. Create a dummy/default user to own the old records
            migrationBuilder.Sql(
                "INSERT INTO \"Users\" (\"Id\", \"Email\", \"PasswordHash\", \"CreatedAt\") " +
                "VALUES ('default-system-user', 'system@powerbuy.local', 'NO_LOGIN_ALLOWED', NOW());"
            );

            // 2. Assign all existing purchases to this new default user
            migrationBuilder.Sql(
                "UPDATE \"Purchases\" SET \"UserId\" = 'default-system-user' " +
                "WHERE \"UserId\" IS NULL OR \"UserId\" NOT IN (SELECT \"Id\" FROM \"Users\");"
            );

            // =========================================================================

            migrationBuilder.CreateIndex(
                name: "IX_Purchases_UserId",
                table: "Purchases",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Purchases_Users_UserId",
                table: "Purchases",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Purchases_Users_UserId",
                table: "Purchases");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Purchases_UserId",
                table: "Purchases");
        }
    }
}
