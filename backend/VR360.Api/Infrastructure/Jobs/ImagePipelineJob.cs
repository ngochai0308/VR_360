using ImageMagick;
using Microsoft.EntityFrameworkCore;
using VR360.Api.Infrastructure.Data;
using VR360.Api.Infrastructure.Storage;

namespace VR360.Api.Infrastructure.Jobs;

public class ImagePipelineJob(AppDbContext db, StorageService storage, ILogger<ImagePipelineJob> logger)
{
    public async Task ProcessAsync(Guid sceneId, string tempFilePath)
    {
        var scene = await db.Scenes.FirstOrDefaultAsync(s => s.SceneId == sceneId);
        if (scene is null)
        {
            logger.LogWarning("Scene {SceneId} not found — skipping pipeline", sceneId);
            return;
        }

        try
        {
            using var panorama = new MagickImage(tempFilePath);
            panorama.Strip(); // remove ICC profile & metadata

            var cdnPrefix = $"scenes/{scene.SlugDiTich}";

            // Normalize to 2:1 equirectangular canvas (pad with black if needed)
            using var fullRes = NormalizeTo2x1(panorama, 4096);
            await UploadWebP(fullRes, $"{cdnPrefix}/panorama.webp", 82);

            using var preview = NormalizeTo2x1(panorama, 1024);
            await UploadWebP(preview, $"{cdnPrefix}/panorama_preview.webp", 65);

            scene.BaseUrlCDN = storage.GetPublicUrl(cdnPrefix);
            await db.SaveChangesAsync();

            logger.LogInformation("Pipeline complete for scene {SceneId} → {Url}", sceneId, scene.BaseUrlCDN);
        }
        finally
        {
            if (File.Exists(tempFilePath)) File.Delete(tempFilePath);
        }
    }

    // Resize image to fit within maxWidth×(maxWidth/2), pad to exact 2:1 with black
    private static MagickImage NormalizeTo2x1(MagickImage source, uint maxWidth)
    {
        var maxHeight = maxWidth / 2;
        var ratio = (double)source.Width / source.Height;

        uint drawW, drawH;
        if (ratio >= 2.0)
        {
            // Wider than 2:1 — fit by width
            drawW = maxWidth;
            drawH = (uint)(maxWidth / ratio);
        }
        else
        {
            // Taller than 2:1 — fit by height
            drawH = maxHeight;
            drawW = (uint)(maxHeight * ratio);
        }

        var resized = (MagickImage)source.Clone();
        resized.Resize(new MagickGeometry(drawW, drawH) { IgnoreAspectRatio = true });

        // Create black 2:1 canvas and composite image centered
        var canvas = new MagickImage(MagickColors.Black, maxWidth, maxHeight);
        var x = (int)((maxWidth - drawW) / 2);
        var y = (int)((maxHeight - drawH) / 2);
        canvas.Composite(resized, x, y, CompositeOperator.Over);
        resized.Dispose();
        return canvas;
    }

    private async Task UploadWebP(IMagickImage img, string key, int quality)
    {
        img.Format = MagickFormat.WebP;
        img.Quality = (uint)quality;
        using var ms = new MemoryStream();
        await img.WriteAsync(ms);
        ms.Position = 0;
        await storage.UploadAsync(key, ms, "image/webp");
    }
}
