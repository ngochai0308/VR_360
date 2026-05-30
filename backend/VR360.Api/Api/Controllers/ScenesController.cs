using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VR360.Api.Api.DTOs;
using VR360.Api.Domain.Entities;
using VR360.Api.Infrastructure.Data;

namespace VR360.Api.Api.Controllers;

[ApiController]
[Route("api/scenes")]
public class ScenesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string lang = "vi")
    {
        var scenes = await db.Scenes
            .Include(s => s.Translations.Where(t => t.LanguageCode == lang))
            .Include(s => s.Hotspots)
                .ThenInclude(h => h.Translations.Where(t => t.LanguageCode == lang))
            .ToListAsync();

        return Ok(scenes.Select(s => MapToDto(s, lang)));
    }

    [HttpGet("default")]
    public async Task<IActionResult> GetDefault([FromQuery] string lang = "vi")
    {
        var scene = await db.Scenes
            .Include(s => s.Translations.Where(t => t.LanguageCode == lang))
            .Include(s => s.Hotspots)
                .ThenInclude(h => h.Translations.Where(t => t.LanguageCode == lang))
            .FirstOrDefaultAsync(s => s.IsDefault);

        if (scene is null) return NotFound();
        return Ok(MapToDto(scene, lang));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, [FromQuery] string lang = "vi")
    {
        var scene = await db.Scenes
            .Include(s => s.Translations.Where(t => t.LanguageCode == lang))
            .Include(s => s.Hotspots)
                .ThenInclude(h => h.Translations.Where(t => t.LanguageCode == lang))
            .FirstOrDefaultAsync(s => s.SceneId == id);

        if (scene is null) return NotFound();
        return Ok(MapToDto(scene, lang));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSceneRequest req)
    {
        if (req.IsDefault)
            await db.Scenes.Where(s => s.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false));

        var scene = new Scene
        {
            SlugDiTich = req.SlugDiTich,
            IsDefault = req.IsDefault,
            BaseUrlCDN = string.Empty,
            Translations = req.Translations.Select(t => new SceneTranslation
            {
                LanguageCode = t.LanguageCode,
                TieuDe = t.TieuDe,
                UrlAudio = t.UrlAudio
            }).ToList()
        };

        db.Scenes.Add(scene);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = scene.SceneId }, new { scene.SceneId });
    }

    [HttpPatch("{id:guid}/set-default")]
    public async Task<IActionResult> SetDefault(Guid id)
    {
        var exists = await db.Scenes.AnyAsync(s => s.SceneId == id);
        if (!exists) return NotFound();

        await db.Scenes.ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false));
        await db.Scenes.Where(s => s.SceneId == id).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, true));
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var rows = await db.Scenes.Where(s => s.SceneId == id).ExecuteDeleteAsync();
        return rows > 0 ? NoContent() : NotFound();
    }

    private static SceneDto MapToDto(Scene scene, string lang)
    {
        var t = scene.Translations.FirstOrDefault(x => x.LanguageCode == lang);
        return new SceneDto(
            scene.SceneId,
            scene.SlugDiTich,
            scene.BaseUrlCDN,
            scene.IsDefault,
            t?.TieuDe ?? string.Empty,
            t?.UrlAudio,
            scene.Hotspots.Select(h =>
            {
                var ht = h.Translations.FirstOrDefault(x => x.LanguageCode == lang);
                return new HotspotDto(h.HotspotId, h.Type, h.Yaw, h.Pitch, h.NextSceneId,
                    ht?.TieuDePopup, ht?.NoiDungPopup, ht?.UrlAudio);
            })
        );
    }
}
