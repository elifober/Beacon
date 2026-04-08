using Beacon.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Beacon.API.Controllers;

/// <summary>
/// Admin-only endpoints for role management (Partner / Admin). Supporter is assigned automatically on registration.
/// </summary>
[ApiController]
[Route("api/auth/admin")]
[Authorize(Roles = AuthRoles.Admin)]
public class AdminIdentityController(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager) : ControllerBase
{
    public sealed record AssignRoleRequest(string Email, string Role);

    /// <summary>
    /// Assigns Partner or Admin to an existing user by email. Idempotent if the user already has the role.
    /// </summary>
    [HttpPost("assign-role")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new { message = "Email and Role are required." });
        }

        var normalizedRole = request.Role.Trim();
        if (!string.Equals(normalizedRole, AuthRoles.Admin, StringComparison.Ordinal) &&
            !string.Equals(normalizedRole, AuthRoles.Partner, StringComparison.Ordinal))
        {
            return BadRequest(new
            {
                message = "Only Admin or Partner can be assigned through this endpoint. Supporter is assigned automatically when users register."
            });
        }

        if (!await roleManager.RoleExistsAsync(normalizedRole))
        {
            return BadRequest(new { message = $"Role '{normalizedRole}' does not exist." });
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (await userManager.IsInRoleAsync(user, normalizedRole))
        {
            return Ok(new { message = "User already has this role." });
        }

        var result = await userManager.AddToRoleAsync(user, normalizedRole);
        if (!result.Succeeded)
        {
            return Problem(
                detail: string.Join("; ", result.Errors.Select(e => e.Description)),
                statusCode: StatusCodes.Status500InternalServerError);
        }

        return Ok(new { message = $"Role '{normalizedRole}' assigned to {user.Email}." });
    }
}
