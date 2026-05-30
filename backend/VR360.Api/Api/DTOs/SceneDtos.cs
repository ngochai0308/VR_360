namespace VR360.Api.Api.DTOs;

public record SceneDto(
    Guid SceneId,
    string SlugDiTich,
    string BaseUrlCDN,
    bool IsDefault,
    string TieuDe,
    string? UrlAudio,
    IEnumerable<HotspotDto> Hotspots
);

public record HotspotDto(
    Guid HotspotId,
    string Type,
    double Yaw,
    double Pitch,
    Guid? NextSceneId,
    string? TieuDePopup,
    string? NoiDungPopup,
    string? UrlAudio
);

public record CreateSceneRequest(
    string SlugDiTich,
    bool IsDefault,
    IEnumerable<SceneTranslationRequest> Translations
);

public record SceneTranslationRequest(
    string LanguageCode,
    string TieuDe,
    string? UrlAudio
);

public record CreateHotspotRequest(
    Guid SceneId,
    string Type,
    double Yaw,
    double Pitch,
    Guid? NextSceneId,
    IEnumerable<HotspotTranslationRequest> Translations
);

public record HotspotTranslationRequest(
    string LanguageCode,
    string? TieuDePopup,
    string? NoiDungPopup,
    string? UrlAudio
);

public record UpdateHotspotRequest(
    string Type,
    double Yaw,
    double Pitch,
    Guid? NextSceneId,
    IEnumerable<HotspotTranslationRequest> Translations
);
