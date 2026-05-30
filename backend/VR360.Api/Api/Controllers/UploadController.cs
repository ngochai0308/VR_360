using Hangfire;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VR360.Api.Infrastructure.Data;
using VR360.Api.Infrastructure.Jobs;
using VR360.Api.Infrastructure.Storage;

namespace VR360.Api.Api.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController(
    AppDbContext db,
    StorageService storage,
    IBackgroundJobClient jobs,
    IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("panorama/{sceneId:guid}")]
    [RequestSizeLimit(200_000_000)] // 200 MB
    public async Task<IActionResult> UploadPanorama(Guid sceneId, IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest("No file.");

        var exists = await db.Scenes.AnyAsync(s => s.SceneId == sceneId);
        if (!exists) return NotFound("Scene not found.");

        var tmpDir = Path.Combine(env.ContentRootPath, "tmp");
        Directory.CreateDirectory(tmpDir);
        var tmpPath = Path.Combine(tmpDir, $"{sceneId}_{Guid.NewGuid()}.tmp");

        await using (var fs = System.IO.File.Create(tmpPath))
            await file.CopyToAsync(fs);

        jobs.Enqueue<ImagePipelineJob>(j => j.ProcessAsync(sceneId, tmpPath));

        return Accepted(new { message = "Processing started", sceneId });
    }

    [HttpPost("audio/{sceneId:guid}")]
    [RequestSizeLimit(50_000_000)] // 50 MB
    public async Task<IActionResult> UploadAudio(Guid sceneId, IFormFile file, [FromQuery] string lang)
    {
        if (file is null || file.Length == 0) return BadRequest("No file.");

        var translation = await db.SceneTranslations
            .FirstOrDefaultAsync(t => t.SceneId == sceneId && t.LanguageCode == lang);

        if (translation is null) return NotFound("Translation not found.");

        var scene = await db.Scenes.FindAsync(sceneId);
        var key = $"scenes/{scene!.SlugDiTich}/audio_{lang}.mp3";

        await using var stream = file.OpenReadStream();
        await storage.UploadAsync(key, stream, "audio/mpeg");

        translation.UrlAudio = storage.GetPublicUrl(key);
        await db.SaveChangesAsync();

        return Ok(new { url = translation.UrlAudio });
    }

    [HttpPost("hotspot-audio/{hotspotId:guid}")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadHotspotAudio(Guid hotspotId, IFormFile file, [FromQuery] string lang)
    {
        if (file is null || file.Length == 0) return BadRequest("No file.");

        var translation = await db.HotspotTranslations
            .Include(t => t.Hotspot).ThenInclude(h => h.Scene)
            .FirstOrDefaultAsync(t => t.HotspotId == hotspotId && t.LanguageCode == lang);

        if (translation is null) return NotFound("Translation not found.");

        var slug = translation.Hotspot.Scene.SlugDiTich;
        var key = $"scenes/{slug}/hotspots/{hotspotId}/audio_{lang}.mp3";

        await using var stream = file.OpenReadStream();
        await storage.UploadAsync(key, stream, "audio/mpeg");

        translation.UrlAudio = storage.GetPublicUrl(key);
        await db.SaveChangesAsync();

        return Ok(new { url = translation.UrlAudio });
    }
}
