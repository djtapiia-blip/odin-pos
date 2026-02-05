using Microsoft.EntityFrameworkCore;
using OdinPos.Api.Data;
using OdinPos.Api.Auth;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", p =>
        p.WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
    );
});

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var app = builder.Build();

// Seed (si lo estás usando)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    SeedData.Initialize(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ✅ CORS SIEMPRE antes del middleware (para que OPTIONS no se rompa)
app.UseCors("dev");

// ✅ middleware de roles
app.UseMiddleware<RoleAuthMiddleware>();

app.MapControllers();
app.Run();
