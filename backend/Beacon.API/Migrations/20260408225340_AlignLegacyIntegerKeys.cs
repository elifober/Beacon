using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Beacon.API.Migrations
{
    /// <inheritdoc />
    public partial class AlignLegacyIntegerKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No DDL: imported Postgres tables use plain integer PKs (no IDENTITY). EF previously modeled
            // these as IdentityByDefaultColumn only in the snapshot; runtime already uses client-assigned keys.
            // This migration exists so MigrateAsync() sees no pending model changes vs the snapshot.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
