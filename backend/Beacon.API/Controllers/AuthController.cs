using System.Security.Claims;
using Beacon.API.Models;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Beacon.API.Data;
using Beacon.API.Services;

namespace Beacon.API.Controllers;

public sealed class RegisterWithProfileRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string? Phone { get; set; }
}

public sealed class CompleteProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string? Phone { get; set; }
}

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    AuthIdentityDbContext db,
    IConfiguration configuration,
    ILogger<AuthController> logger) : ControllerBase
{
    private const string DefaultFrontendUrl = "http://localhost:2026";
    private const string DefaultExternalReturnPath = "/login";
    private const string ProfileCompleteClaimType = "profile_complete";

    private async Task EnsureSupporterProfileAfterExternalSignInAsync(ApplicationUser? user)
    {
        if (user is null || userManager is not BeaconUserManager beacon)
        {
            return;
        }

        await beacon.EnsureSupporterProfileForUserAsync(user);
    }

    private static string CombineSupporterDisplayName(string firstName, string lastName)
    {
        var f = firstName.Trim();
        var l = lastName.Trim();
        if (f.Length == 0 && l.Length == 0)
        {
            return string.Empty;
        }

        if (l.Length == 0)
        {
            return f;
        }

        if (f.Length == 0)
        {
            return l;
        }

        return $"{f} {l}";
    }

    [HttpGet("me")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetCurrentSession()
    {
        // Edge/CDN must not serve one cached body for all users; ResponseCache + Vary on Cookie.
        Response.Headers.Append("Vary", "Cookie");

        if (User.Identity?.IsAuthenticated != true)
        {
            return Ok(new
            {
                isAuthenticated = false,
                userName = (string?)null,
                email = (string?)null,
                roles = Array.Empty<string>(),
                supporterId = (int?)null,
                needsProfileCompletion = false
            });
        }

        try
        {
            var user = await userManager.GetUserAsync(User);
            var roles = User.Claims
                .Where(claim => claim.Type == ClaimTypes.Role)
                .Select(claim => claim.Value)
                .Distinct()
                .OrderBy(role => role)
                .ToArray();

            int? supporterId = null;
            if (user?.Id is { Length: > 0 })
            {
                supporterId = await db.Supporters
                    .AsNoTracking()
                    .Where(s => s.IdentityUserId == user.Id)
                    .Select(s => (int?)s.SupporterId)
                    .FirstOrDefaultAsync();
            }

            var needsProfileCompletion = await ComputeNeedsProfileCompletionAsync(user, roles);

            return Ok(new
            {
                isAuthenticated = true,
                userName = user?.UserName ?? User.Identity?.Name,
                email = user?.Email,
                roles,
                supporterId,
                needsProfileCompletion
            });
        }
        catch (Exception ex)
        {
            // Unhandled exceptions here often surface to the client as 502 + "CORS" (proxy error without ACAO).
            logger.LogError(ex, "GET /api/auth/me failed while building the session");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Unable to load session.",
            });
        }
    }

    private async Task<bool> ComputeNeedsProfileCompletionAsync(ApplicationUser? user, string[] roles)
    {
        if (user is null)
        {
            return false;
        }

        if (roles.Contains(AuthRoles.Admin) || roles.Contains(AuthRoles.Partner))
        {
            return false;
        }

        if (!roles.Contains(AuthRoles.Supporter))
        {
            return false;
        }

        var storedClaims = await userManager.GetClaimsAsync(user);
        if (storedClaims.Any(c => c.Type == ProfileCompleteClaimType && c.Value == "true"))
        {
            return false;
        }

        return true;
    }

    [HttpGet("providers")]
    public IActionResult GetExternalProviders()
    {
        var providers = new List<object>();

        if (IsGoogleConfigured())
        {
            providers.Add(new
            {
                name = GoogleDefaults.AuthenticationScheme,
                displayName = "Google"
            });
        }

        return Ok(providers);
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin(
        [FromQuery] string provider,
        [FromQuery] string? returnPath = null)
    {
        if (!string.Equals(provider, GoogleDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) ||
            !IsGoogleConfigured())
        {
            return BadRequest(new
            {
                message = "The requested external login provider is not available."
            });
        }

        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), new
        {
            returnPath = NormalizeReturnPath(returnPath)
        });

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            return Problem("Unable to create the external login callback URL.");
        }

        var properties = signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme,
            callbackUrl);

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnPath = null, [FromQuery] string? remoteError = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect(BuildFrontendErrorUrl("External login failed."));
        }

        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            return Redirect(BuildFrontendErrorUrl("External login information was unavailable."));
        }

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        var emailFromClaims = info.Principal.FindFirstValue(ClaimTypes.Email) ??
            info.Principal.FindFirstValue("email");

        if (signInResult.Succeeded)
        {
            var signedInUser = await userManager.GetUserAsync(User);
            if (signedInUser is null && !string.IsNullOrWhiteSpace(emailFromClaims))
            {
                signedInUser = await userManager.FindByEmailAsync(emailFromClaims);
            }

            await EnsureSupporterProfileAfterExternalSignInAsync(signedInUser);
            return Redirect(BuildFrontendSuccessUrl(returnPath));
        }

        var email = emailFromClaims;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect(BuildFrontendErrorUrl("The external provider did not return an email address."));
        }

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var createUserResult = await userManager.CreateAsync(user);

            if (!createUserResult.Succeeded)
            {
                return Redirect(BuildFrontendErrorUrl("Unable to create a local account for the external login."));
            }
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);

        if (!addLoginResult.Succeeded)
        {
            return Redirect(BuildFrontendErrorUrl("Unable to associate the external login with the local account."));
        }

        await signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
        await EnsureSupporterProfileAfterExternalSignInAsync(user);
        return Redirect(BuildFrontendSuccessUrl(returnPath));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return Ok(new
        {
            message = "Logout successful."
        });
    }

    /// <summary>
    /// Register with donor profile fields (updates <c>supporters</c>). <c>CreatedAt</c> is set server-side.
    /// </summary>
    [HttpPost("register-with-profile")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterWithProfile([FromBody] RegisterWithProfileRequest request)
    {
        var email = request.Email?.Trim() ?? string.Empty;
        var firstName = request.FirstName?.Trim() ?? string.Empty;
        var lastName = request.LastName?.Trim() ?? string.Empty;
        var displayName = CombineSupporterDisplayName(firstName, lastName);

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(request.Password) ||
            string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
        {
            return BadRequest(new { message = "Email, password, first name, and last name are required." });
        }

        var reservedForPartner = await db.Partners
            .AsNoTracking()
            .AnyAsync(p => p.Email != null && p.Email.Trim().ToLower() == email.ToLowerInvariant());
        if (reservedForPartner)
        {
            return BadRequest(new { message = "This email is already used for a partner account. Contact an administrator." });
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = false
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                message = "Registration failed.",
                errors = createResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        var createdAt = DateTime.UtcNow;
        var org = string.IsNullOrWhiteSpace(request.OrganizationName)
            ? null
            : request.OrganizationName.Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone)
            ? null
            : request.Phone.Trim();

        var supporter = await db.Supporters.FirstOrDefaultAsync(s => s.IdentityUserId == user.Id);
        if (supporter is null)
        {
            var supporterId = await db.AllocateNextSupporterIdAsync();
            await db.InsertSupporterRowAsync(
                supporterId,
                email,
                user.Id,
                displayName,
                firstName,
                lastName,
                org,
                phone,
                createdAt,
                "Active");
        }
        else
        {
            supporter.DisplayName = displayName;
            supporter.FirstName = firstName;
            supporter.LastName = lastName;
            supporter.OrganizationName = org;
            supporter.Phone = phone;
            supporter.Email = email;
            supporter.CreatedAt ??= createdAt;
        }

        await db.SaveChangesAsync();

        await userManager.AddClaimAsync(user, new Claim(ProfileCompleteClaimType, "true"));
        await signInManager.SignInAsync(user, isPersistent: false);

        return Ok(new { message = "Registration successful." });
    }

    /// <summary>
    /// Finishes donor profile after Google (or other) sign-in when the <c>profile_complete</c> claim is missing.
    /// </summary>
    [HttpPost("complete-profile")]
    [Authorize]
    public async Task<IActionResult> CompleteProfile([FromBody] CompleteProfileRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        if (await userManager.IsInRoleAsync(user, AuthRoles.Admin) ||
            await userManager.IsInRoleAsync(user, AuthRoles.Partner))
        {
            return BadRequest(new { message = "Profile completion is not required for this account." });
        }

        var firstName = request.FirstName?.Trim() ?? string.Empty;
        var lastName = request.LastName?.Trim() ?? string.Empty;
        var displayName = CombineSupporterDisplayName(firstName, lastName);
        if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
        {
            return BadRequest(new { message = "First name and last name are required." });
        }

        var org = string.IsNullOrWhiteSpace(request.OrganizationName)
            ? null
            : request.OrganizationName.Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone)
            ? null
            : request.Phone.Trim();

        var supporter = await db.Supporters.FirstOrDefaultAsync(s => s.IdentityUserId == user.Id);
        var email = user.Email?.Trim() ?? string.Empty;

        if (supporter is null)
        {
            var supporterId = await db.AllocateNextSupporterIdAsync();
            await db.InsertSupporterRowAsync(
                supporterId,
                email,
                user.Id,
                displayName,
                firstName,
                lastName,
                org,
                phone,
                DateTime.UtcNow,
                "Active");
        }
        else
        {
            supporter.DisplayName = displayName;
            supporter.FirstName = firstName;
            supporter.LastName = lastName;
            supporter.OrganizationName = org;
            supporter.Phone = phone;
            if (!string.IsNullOrEmpty(email))
            {
                supporter.Email = email;
            }

            supporter.CreatedAt ??= DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        var existing = await userManager.GetClaimsAsync(user);
        if (!existing.Any(c => c.Type == ProfileCompleteClaimType && c.Value == "true"))
        {
            await userManager.AddClaimAsync(user, new Claim(ProfileCompleteClaimType, "true"));
        }

        await signInManager.RefreshSignInAsync(user);

        return Ok(new { message = "Profile saved." });
    }

    private bool IsGoogleConfigured()
    {
        return !string.IsNullOrWhiteSpace(configuration["Authentication:Google:ClientId"]) &&
            !string.IsNullOrWhiteSpace(configuration["Authentication:Google:ClientSecret"]);
    }

    private string NormalizeReturnPath(string? returnPath)
    {
        if (string.IsNullOrWhiteSpace(returnPath) || !returnPath.StartsWith('/'))
        {
            return DefaultExternalReturnPath;
        }

        return returnPath;
    }

    private string BuildFrontendSuccessUrl(string? returnPath)
    {
        var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
        return $"{frontendUrl.TrimEnd('/')}{NormalizeReturnPath(returnPath)}";
    }

    private string BuildFrontendErrorUrl(string errorMessage)
    {
        var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
        var loginUrl = $"{frontendUrl.TrimEnd('/')}/login";
        return QueryHelpers.AddQueryString(loginUrl, "externalError", errorMessage);
    }
}