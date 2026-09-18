using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DooDuckInn.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSentToTaxes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSent",
                table: "Taxes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSent",
                table: "Taxes");
        }
    }
}
