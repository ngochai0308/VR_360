using Microsoft.EntityFrameworkCore;
using VR360.Api.Domain.Entities;

namespace VR360.Api.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Scene> Scenes => Set<Scene>();
    public DbSet<SceneTranslation> SceneTranslations => Set<SceneTranslation>();
    public DbSet<Hotspot> Hotspots => Set<Hotspot>();
    public DbSet<HotspotTranslation> HotspotTranslations => Set<HotspotTranslation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Scene>(e =>
        {
            e.HasKey(x => x.SceneId);
            e.Property(x => x.SlugDiTich).HasMaxLength(150).IsRequired();
            e.Property(x => x.BaseUrlCDN).HasMaxLength(500).IsRequired();
            e.HasIndex(x => x.SlugDiTich).IsUnique();
        });

        modelBuilder.Entity<SceneTranslation>(e =>
        {
            e.HasKey(x => x.TranslationId);
            e.Property(x => x.LanguageCode).HasMaxLength(10).IsRequired();
            e.Property(x => x.TieuDe).HasMaxLength(250).IsRequired();
            e.Property(x => x.UrlAudio).HasMaxLength(500);
            e.HasIndex(x => new { x.SceneId, x.LanguageCode }).IsUnique();
            e.HasOne(x => x.Scene)
                .WithMany(s => s.Translations)
                .HasForeignKey(x => x.SceneId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Hotspot>(e =>
        {
            e.HasKey(x => x.HotspotId);
            e.Property(x => x.Type).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Scene)
                .WithMany(s => s.Hotspots)
                .HasForeignKey(x => x.SceneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.NextScene)
                .WithMany()
                .HasForeignKey(x => x.NextSceneId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<HotspotTranslation>(e =>
        {
            e.HasKey(x => x.TranslationId);
            e.Property(x => x.LanguageCode).HasMaxLength(10).IsRequired();
            e.Property(x => x.TieuDePopup).HasMaxLength(250);
            e.HasIndex(x => new { x.HotspotId, x.LanguageCode }).IsUnique();
            e.HasOne(x => x.Hotspot)
                .WithMany(h => h.Translations)
                .HasForeignKey(x => x.HotspotId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
