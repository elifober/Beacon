using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Beacon.API.Models;

namespace Beacon.API.Data;

public static class IdentitySeeder
{
    public static async Task SeedUsersAndRolesAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = serviceProvider.GetRequiredService<AuthIdentityDbContext>();

        // Ensure roles exist
        string[] roles = new[] { "Admin", "Partner", "Supporter" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // --- SEED SUPPORTERS ---
        // Fetch only those who don't have an ID and have a valid email string
        var supportersWithoutLogins = await context.Supporters
            .Where(s => s.IdentityUserId == null && s.Email != null && s.Email != "")
            .ToListAsync();

        Console.WriteLine($"Found {supportersWithoutLogins.Count} supporters to process...");

        foreach (var supporter in supportersWithoutLogins)
        {
            var user = new ApplicationUser 
            { 
                UserName = supporter.Email, 
                Email = supporter.Email 
            };
            
            var result = await userManager.CreateAsync(user, "TempBeaconPass2026!");
            
            if (result.Succeeded)
            {
                // Supporter role is assigned automatically by BeaconUserManager on CreateAsync.
                supporter.IdentityUserId = user.Id;
            }
            else
            {
                // THIS WILL TELL US EXACTLY WHY IT FAILED
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"[SKIPPED SUPPORTER] {supporter.Email} - Reason: {errors}");
            }
        }

        // --- SEED PARTNERS ---
        var partnersWithoutLogins = await context.Partners
            .Where(p => p.IdentityUserId == null && p.Email != null && p.Email != "")
            .ToListAsync();

        Console.WriteLine($"Found {partnersWithoutLogins.Count} partners to process...");

        foreach (var partner in partnersWithoutLogins)
        {
            var user = new ApplicationUser 
            { 
                UserName = partner.Email, 
                Email = partner.Email 
            };
            
            var result = await userManager.CreateAsync(user, "TempBeaconPass2026!");
            
            if (result.Succeeded)
            {
                if (partner.RoleType != null && partner.RoleType.Contains("Admin"))
                {
                    await userManager.AddToRoleAsync(user, "Admin");
                }
                else
                {
                    await userManager.AddToRoleAsync(user, "Partner");
                }
                
                partner.IdentityUserId = user.Id;
            }
            else
            {
                // THIS WILL TELL US EXACTLY WHY IT FAILED
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"[SKIPPED PARTNER] {partner.Email} - Reason: {errors}");
            }
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Seeding process finished!");
    }
}