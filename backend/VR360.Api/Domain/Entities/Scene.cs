namespace VR360.Api.Domain.Entities;

public class Scene
{
    public Guid SceneId { get; set; } = Guid.NewGuid();
    public string SlugDiTich { get; set; } = string.Empty;
    public string BaseUrlCDN { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SceneTranslation> Translations { get; set; } = [];
    public ICollection<Hotspot> Hotspots { get; set; } = [];
}
