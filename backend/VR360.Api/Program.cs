using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Scalar.AspNetCore;
using VR360.Api.Infrastructure.Data;
using VR360.Api.Infrastructure.Jobs;
using VR360.Api.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Local file storage
builder.Services.AddScoped<StorageService>();

// Hangfire
builder.Services.AddHangfire(cfg => cfg
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<ImagePipelineJob>();

// CORS
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration["Cors:AllowedOrigins"]!.Split(','))
     .AllowAnyMethod()
     .AllowAnyHeader()));

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference();

// Serve uploaded files as static content at /uploads
var uploadPath = builder.Configuration["Storage:UploadPath"]!;
Directory.CreateDirectory(uploadPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        ctx.Context.Response.Headers["Cache-Control"] = "public,max-age=31536000";
    }
});

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.UseHangfireDashboard("/hangfire");

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();

app.Run();
