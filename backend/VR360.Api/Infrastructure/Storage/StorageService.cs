namespace VR360.Api.Infrastructure.Storage;

public class StorageService(IConfiguration config)
{
    private readonly string _root = config["Storage:UploadPath"]!;
    private readonly string _baseUrl = config["Storage:BaseUrl"]!.TrimEnd('/');

    public async Task UploadAsync(string key, Stream stream, string contentType, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_root, key.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fs = File.Create(fullPath);
        await stream.CopyToAsync(fs, ct);
    }

    public string GetPublicUrl(string key) => $"{_baseUrl}/uploads/{key}";
}
