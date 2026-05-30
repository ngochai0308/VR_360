namespace VR360.Api.Domain.Entities;

public class HotspotTranslation
{
    public Guid TranslationId { get; set; } = Guid.NewGuid();
    public Guid HotspotId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string? TieuDePopup { get; set; }
    public string? NoiDungPopup { get; set; }
    public string? UrlAudio { get; set; }

    public Hotspot Hotspot { get; set; } = null!;
}
