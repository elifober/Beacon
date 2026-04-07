using Microsoft.AspNetCore.Identity;

namespace Beacon.API.Data
{   
    public class AuthIdentityGenerator
    {
        public static async Task GenerateDefaultIdentityAsync(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor })
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
            var adminPassword = adminSection["Password"] ?? "Admin123!";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
            }
            var createAdminResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (!createAdminResult.Succeeded)
            {
                throw new Exception($"Failed to create admin user {adminEmail}: {string.Join(", ", createAdminResult.Errors.Select(e => e.Description))}");
            }

            if (!await userManager.IsInRoleAsync(adminUser, AuthRoles.Admin)    )
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