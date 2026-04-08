using Beacon.API.Data;
using Beacon.API.Models;
using Beacon.API.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Beacon.API.Infrastructure;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.HttpOverrides;
using Beacon.Api.Services.PostPlanner;

var builder = WebApplication.CreateBuilder(args);

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

builder.Services.AddControllers();

// Railway (and most PaaS) run behind a reverse proxy that terminates TLS.
// Respect X-Forwarded-Proto so OAuth redirect_uri becomes https://... instead of http://...
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Trust proxy headers (common in container/PaaS environments).
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredUniqueChars = 1;
    options.Password.RequiredLength = 15;
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    // Cross-site cookie needed for Vercel (frontend) -> Railway (backend) requests with credentials.
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.None;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
});

var corsAllowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (corsAllowedOrigins.Length == 0)
{
    corsAllowedOrigins = ["http://localhost:5173", "https://localhost:5173"];
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        // Use one predicate: WithOrigins + SetIsOriginAllowed together can make only the callback apply,
        // and a thrown Uri parse breaks CORS with a 500 and no Access-Control-Allow-Origin.
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin))
            {
                return false;
            }

            try
            {
                var uri = new Uri(origin);
                if (uri.Scheme is not ("http" or "https"))
                {
                    return false;
                }

                if (corsAllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                {
                    return true;
                }

                var host = uri.IdnHost;
                if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                    host == "127.0.0.1")
                {
                    return true;
                }

                if (host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                return false;
            }
            catch (UriFormatException)
            {
                return false;
            }
        });

        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
        policy.AllowCredentials();
    });
});

// Single registration: duplicate AddDbContext overwrote snake_case and broke PostgreSQL table names.
builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("BeaconConnection"))
        .UseSnakeCaseNamingConvention());

// Persist DP keys in Postgres so OAuth correlation survives multiple Railway instances / cold starts.
builder.Services.AddDataProtection()
    .PersistKeysToDbContext<AuthIdentityDbContext>()
    .SetApplicationName("Beacon.API");

builder.Services.Configure<CookieAuthenticationOptions>(IdentityConstants.ExternalScheme, options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.None;
});

builder.Services.AddSingleton<PostSuccessPredictor>();

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AuthIdentityDbContext>();

builder.Services.AddScoped<UserManager<ApplicationUser>, BeaconUserManager>();

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication(GoogleDefaults.AuthenticationScheme)
    .AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.SignInScheme = IdentityConstants.ExternalScheme;
        options.CallbackPath = "/signin-google";
        options.CorrelationCookie.SameSite = SameSiteMode.None;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.CorrelationCookie.IsEssential = true;
    });
}

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.ManageResidents, policy => policy.RequireRole(AuthRoles.Admin));
    options.AddPolicy(AuthPolicies.AdminOnly, policy => policy.RequireRole(AuthRoles.Admin));
    options.AddPolicy(AuthPolicies.DonorOnly, policy => policy.RequireRole(AuthRoles.Supporter, AuthRoles.Admin));
    options.AddPolicy(AuthPolicies.PartnerOnly, policy => policy.RequireRole(AuthRoles.Partner, AuthRoles.Admin));
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Combine all database setup into this single scope block
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AuthIdentityDbContext>();
    
    // 1. Apply any pending migrations
    await db.Database.MigrateAsync();
    
    // 2. Run your existing default identity generator
    await AuthIdentityGenerator.GenerateDefaultIdentityAsync(services, app.Configuration);
    
    // 3. Run the new database seeder for your CSV data
    try
    {
        await IdentitySeeder.SeedUsersAndRolesAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the identity database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseForwardedHeaders();

app.UseRouting();
// CORS must run after routing and before auth/endpoints so preflight + error paths get headers.
app.UseCors("Frontend");
app.UseSecurityHeaders();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080"; 
app.Urls.Add($"http://*:{port}");

app.Run();

