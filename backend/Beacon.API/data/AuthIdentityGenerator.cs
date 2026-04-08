using Microsoft.AspNetCore.Identity;

namespace Beacon.API.Data
{   
    public class AuthIdentityGenerator
    {
        public static async Task GenerateDefaultIdentityAsync(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Supporter, AuthRoles.Partner })
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var createRoleResult = await roleManager.CreateAsync(new IdentityRole(roleName));
                    
                    if (!createRoleResult.Succeeded)
                    {
                        throw new Exception($"Failed to create role {roleName}: {string.Join(", ", createRoleResult.Errors.Select(e => e.Description))}");
                    }
                }
            }

            var adminSection = configuration.GetSection("GenerateDefaultIdentityAdmin");
            var adminEmail = adminSection["Email"] ?? "admin@example.com";
            // If you want to force the hardcoded password and ignore appsettings, do this:
            var adminPassword = adminSection["Password"] ?? "AdminPassword12345!";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            // ONLY create the user if they don't already exist
            if (adminUser == null)
            {
                adminUser = new ApplicationUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
                
                // Moved inside the if-statement
                var createAdminResult = await userManager.CreateAsync(adminUser, adminPassword);
                if (!createAdminResult.Succeeded)
                {
                    throw new Exception($"Failed to create admin user {adminEmail}: {string.Join(", ", createAdminResult.Errors.Select(e => e.Description))}");
                }
            }

            // Assign the role (runs whether newly created or already existing)
            if (!await userManager.IsInRoleAsync(adminUser, AuthRoles.Admin))
            {
                var addToRoleResult = await userManager.AddToRoleAsync(adminUser, AuthRoles.Admin);
                if (!addToRoleResult.Succeeded)
                {
                    throw new Exception($"Failed to add admin user {adminEmail} to role {AuthRoles.Admin}: {string.Join(", ", addToRoleResult.Errors.Select(e => e.Description))}");
                }
            }
            
        }
    }
}