using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DooDuckInn.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyScanLimitToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "LastScanDate",
                table: "Users",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ScanCount",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastScanDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ScanCount",
                table: "Users");
        }
    }
}
