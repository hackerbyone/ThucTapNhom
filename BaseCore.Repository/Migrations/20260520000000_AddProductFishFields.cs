using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddProductFishFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CareInstructions",
                table: "Products",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Environment",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaleStock",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FemaleStock",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SelectedGender",
                table: "CartItems",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedGender",
                table: "OrderDetails",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CareInstructions", table: "Products");
            migrationBuilder.DropColumn(name: "Environment", table: "Products");
            migrationBuilder.DropColumn(name: "MaleStock", table: "Products");
            migrationBuilder.DropColumn(name: "FemaleStock", table: "Products");
            migrationBuilder.DropColumn(name: "SelectedGender", table: "CartItems");
            migrationBuilder.DropColumn(name: "SelectedGender", table: "OrderDetails");
        }
    }
}
