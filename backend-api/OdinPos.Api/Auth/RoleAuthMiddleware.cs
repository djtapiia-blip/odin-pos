using Microsoft.AspNetCore.Http;

namespace OdinPos.Api.Auth;

public class RoleAuthMiddleware
{
    private readonly RequestDelegate _next;
    public RoleAuthMiddleware(RequestDelegate next) => _next = next;

    public async Task Invoke(HttpContext ctx)
    {
        var path = (ctx.Request.Path.Value ?? "").ToLowerInvariant();

        if (ctx.Request.Method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            await _next(ctx);
            return;
        }

        if (path == "/" || path == "/favicon.ico" || path.StartsWith("/swagger") || path.StartsWith("/api/health"))
        {
            await _next(ctx);
            return;
        }

        if (path == "/api/auth/login" || path == "/api/auth/register")
        {
            await _next(ctx);
            return;
        }

        var role = (ctx.Request.Headers["X-User-Role"].ToString() ?? "").Trim();
        var email = (ctx.Request.Headers["X-User-Email"].ToString() ?? "").Trim();

        if (string.IsNullOrWhiteSpace(role))
        {
            ctx.Response.StatusCode = 401;
            await ctx.Response.WriteAsync("Missing X-User-Role");
            return;
        }

        bool isAdmin = role == "Admin";
        bool isSupervisor = role == "Supervisor";
        bool isCashier = role == "Cashier";

        // ✅ Admin-only: nuevo panel
        if (path.StartsWith("/api/admin/users"))
        {
            if (!isAdmin) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        }

        // Usuarios viejos en /api/auth/users (si los sigues usando)
        if (path.StartsWith("/api/auth/users"))
        {
            if (!isAdmin) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        }

        if (path.StartsWith("/api/reports") || path.StartsWith("/api/audit"))
        {
            if (!(isAdmin || isSupervisor)) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        }

        if (path.StartsWith("/api/sales"))
        {
            if (!(isAdmin || isSupervisor || isCashier)) { ctx.Response.StatusCode = 403; await ctx.Response.WriteAsync("Forbidden"); return; }
        }

        if (path.StartsWith("/api/products"))
        {
            var method = ctx.Request.Method.ToUpperInvariant();
            if (method != "GET" && !(isAdmin || isSupervisor))
            {
                ctx.Response.StatusCode = 403;
                await ctx.Response.WriteAsync("Forbidden");
                return;
            }
        }

        await _next(ctx);
    }
}

