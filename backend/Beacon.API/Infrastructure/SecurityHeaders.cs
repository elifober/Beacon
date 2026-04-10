namespace Beacon.API.Infrastructure
{

public static class SecurityHeaders
{
    // Minimal CSP for API responses. The SPA (Vercel) may have a separate CSP header.
    // Keep this restrictive: the API should not need third-party scripts/styles.
    public const string ContentSecurityPolicy = "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'";

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        var environment = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();
       return app.Use(async (context, next) =>
       {
        context.Response.OnStarting(() =>
        {
            if (!environment.IsDevelopment() && context.Request.Path.StartsWithSegments("/api/"))
            {
                context.Response.Headers["Content-Security-Policy"] = ContentSecurityPolicy;
            }
            return Task.CompletedTask;
        });
        await next();
       });
    }
}
}