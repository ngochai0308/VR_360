using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VR360.Api.Api.DTOs;
using VR360.Api.Domain.Entities;
using VR360.Api.Infrastructure.Data;

namespace VR360.Api.Api.Controllers;

[ApiController]
[Route("api/hotspots")]
public class HotspotsController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHotspotRequest req)
    {
        var sceneExists = await db.Scenes.AnyAsync(s => s.SceneId == req.SceneId);
        if (!sceneExists) return BadRequest("Scene not found.");

        var hotspot = new Hotspot
        {
            SceneId = req.SceneId,
            Type = req.Type,
            Yaw = req.Yaw,
            Pitch = req.Pitch,
            NextSceneId = req.NextSceneId,
            Translations = req.Translations.Select(t => new HotspotTranslation
            {
                LanguageCode = t.LanguageCode,
                TieuDePopup = t.TieuDePopup,
                NoiDungPopup = t.NoiDungPopup,
                UrlAudio = t.UrlAudio
            }).ToList()
        };

        db.Hotspots.Add(hotspot);
        await db.SaveChangesAsync();
        return Created(string.Empty, new { hotspot.HotspotId });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHotspotRequest req)
    {
        var hotspot = await db.Hotspots
            .Include(h => h.Translations)
            .FirstOrDefaultAsync(h => h.HotspotId == id);

        if (hotspot is null) return NotFound();

        hotspot.Type = req.Type;
        hotspot.Yaw = req.Yaw;
        hotspot.Pitch = req.Pitch;
        hotspot.NextSceneId = req.NextSceneId;

        db.HotspotTranslations.RemoveRange(hotspot.Translations);
        hotspot.Translations = req.Translations.Select(t => new HotspotTranslation
        {
            HotspotId = id,
            LanguageCode = t.LanguageCode,
            TieuDePopup = t.TieuDePopup,
            NoiDungPopup = t.NoiDungPopup,
            UrlAudio = t.UrlAudio
        }).ToList();

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var rows = await db.Hotspots.Where(h => h.HotspotId == id).ExecuteDeleteAsync();
        return rows > 0 ? NoContent() : NotFound();
    }
}
