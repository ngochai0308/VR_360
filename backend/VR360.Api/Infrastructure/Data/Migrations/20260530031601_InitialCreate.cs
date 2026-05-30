using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VR360.Api.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Scenes",
                columns: table => new
                {
                    SceneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SlugDiTich = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    BaseUrlCDN = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scenes", x => x.SceneId);
                });

            migrationBuilder.CreateTable(
                name: "Hotspots",
                columns: table => new
                {
                    HotspotId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SceneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Yaw = table.Column<double>(type: "float", nullable: false),
                    Pitch = table.Column<double>(type: "float", nullable: false),
                    NextSceneId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hotspots", x => x.HotspotId);
                    table.ForeignKey(
                        name: "FK_Hotspots_Scenes_NextSceneId",
                        column: x => x.NextSceneId,
                        principalTable: "Scenes",
                        principalColumn: "SceneId");
                    table.ForeignKey(
                        name: "FK_Hotspots_Scenes_SceneId",
                        column: x => x.SceneId,
                        principalTable: "Scenes",
                        principalColumn: "SceneId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SceneTranslations",
                columns: table => new
                {
                    TranslationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SceneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TieuDe = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    UrlAudio = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SceneTranslations", x => x.TranslationId);
                    table.ForeignKey(
                        name: "FK_SceneTranslations_Scenes_SceneId",
                        column: x => x.SceneId,
                        principalTable: "Scenes",
                        principalColumn: "SceneId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotspotTranslations",
                columns: table => new
                {
                    TranslationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HotspotId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TieuDePopup = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    NoiDungPopup = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UrlAudio = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotspotTranslations", x => x.TranslationId);
                    table.ForeignKey(
                        name: "FK_HotspotTranslations_Hotspots_HotspotId",
                        column: x => x.HotspotId,
                        principalTable: "Hotspots",
                        principalColumn: "HotspotId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Hotspots_NextSceneId",
                table: "Hotspots",
                column: "NextSceneId");

            migrationBuilder.CreateIndex(
                name: "IX_Hotspots_SceneId",
                table: "Hotspots",
                column: "SceneId");

            migrationBuilder.CreateIndex(
                name: "IX_HotspotTranslations_HotspotId_LanguageCode",
                table: "HotspotTranslations",
                columns: new[] { "HotspotId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Scenes_SlugDiTich",
                table: "Scenes",
                column: "SlugDiTich",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SceneTranslations_SceneId_LanguageCode",
                table: "SceneTranslations",
                columns: new[] { "SceneId", "LanguageCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HotspotTranslations");

            migrationBuilder.DropTable(
                name: "SceneTranslations");

            migrationBuilder.DropTable(
                name: "Hotspots");

            migrationBuilder.DropTable(
                name: "Scenes");
        }
    }
}
