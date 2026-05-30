namespace VR360.Api.Domain.Entities;

public class Hotspot
{
    public Guid HotspotId { get; set; } = Guid.NewGuid();
    public Guid SceneId { get; set; }
    public string Type { get; set; } = string.Empty; // "MoveTo" | "Info"
    public double Yaw { get; set; }
    public double Pitch { get; set; }
    public Guid? NextSceneId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Scene Scene { get; set; } = null!;
    public Scene? NextScene { get; set; }
    public ICollection<HotspotTranslation> Translations { get; set; } = [];
}
