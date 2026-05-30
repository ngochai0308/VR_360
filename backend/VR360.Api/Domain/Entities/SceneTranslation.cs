namespace VR360.Api.Domain.Entities;

public class SceneTranslation
{
    public Guid TranslationId { get; set; } = Guid.NewGuid();
    public Guid SceneId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string TieuDe { get; set; } = string.Empty;
    public string? UrlAudio { get; set; }

    public Scene Scene { get; set; } = null!;
}
