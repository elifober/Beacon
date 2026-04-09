using Beacon.API.Data;
using Beacon.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Beacon.API.Services;

/// <summary>
/// Ensures every newly created account gets the Supporter (donor) role and a row in <c>supporters</c>
/// (or links an existing CSV donor row). Partner-only CSV users skip the donor row; the seeder links <c>partners</c>.
/// </summary>
public class BeaconUserManager : UserManager<ApplicationUser>
{
    private readonly AuthIdentityDbContext _db;

    public BeaconUserManager(
        IUserStore<ApplicationUser> store,
        IOptions<IdentityOptions> optionsAccessor,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IEnumerable<IUserValidator<ApplicationUser>> userValidators,
        IEnumerable<IPasswordValidator<ApplicationUser>> passwordValidators,
        ILookupNormalizer keyNormalizer,
        IdentityErrorDescriber errors,
        IServiceProvider services,
        ILogger<UserManager<ApplicationUser>> logger,
        AuthIdentityDbContext db)
        : base(
            store,
            optionsAccessor,
            passwordHasher,
            userValidators,
            passwordValidators,
            keyNormalizer,
            errors,
            services,
            logger)
    {
        _db = db;
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user)
    {
        var result = await base.CreateAsync(user);
        if (result.Succeeded)
        {
            await EnsureSupporterRoleAsync(user);
            await EnsureSupporterRowAsync(user);
        }

        return result;
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
    {
        var result = await base.CreateAsync(user, password);
        if (result.Succeeded)
        {
            await EnsureSupporterRoleAsync(user);
            await EnsureSupporterRowAsync(user);
        }

        return result;
    }

    /// <summary>
    /// Idempotent: assigns Supporter role and ensures a <c>supporters</c> row.
    /// Use when the user already existed in Identity (e.g. first Google link) so <see cref="CreateAsync"/> hooks did not run.
    /// </summary>
    public async Task EnsureSupporterProfileForUserAsync(ApplicationUser user)
    {
        await EnsureSupporterRoleAsync(user);
        await EnsureSupporterRowAsync(user);
    }

    private async Task EnsureSupporterRoleAsync(ApplicationUser user)
    {
        if (await IsInRoleAsync(user, AuthRoles.Supporter))
        {
            return;
        }

        await AddToRoleAsync(user, AuthRoles.Supporter);
    }

    /// <summary>
    /// Creates or links a <see cref="Supporter"/> row so Supabase <c>supporters</c> and donor APIs see the user.
    /// </summary>
    private async Task EnsureSupporterRowAsync(ApplicationUser user)
    {
        if (string.IsNullOrEmpty(user.Id))
        {
            return;
        }

        if (await _db.Supporters.AnyAsync(s => s.IdentityUserId == user.Id))
        {
            return;
        }

        var email = user.Email?.Trim();
        if (string.IsNullOrEmpty(email))
        {
            return;
        }

        var emailNorm = email.ToLowerInvariant();

        // CSV partner flow: a partners row exists for this email — link partners only (IdentitySeeder), not supporters.
        var hasPartnerRow = await _db.Partners
            .AsNoTracking()
            .AnyAsync(p => p.Email != null && p.Email.Trim().ToLower() == emailNorm);
        if (hasPartnerRow)
        {
            return;
        }

        var orphan = await _db.Supporters
            .FirstOrDefaultAsync(s =>
                s.Email != null &&
                s.Email.Trim().ToLower() == emailNorm &&
                s.IdentityUserId == null);

        if (orphan is not null)
        {
            orphan.IdentityUserId = user.Id;
            await _db.SaveChangesAsync();
            return;
        }

        var supporterId = await _db.AllocateNextSupporterIdAsync();
        await _db.InsertSupporterRowAsync(
            supporterId,
            email,
            user.Id,
            user.UserName ?? email,
            firstName: null,
            lastName: null,
            organizationName: null,
            phone: null,
            DateTime.UtcNow,
            "Active");
    }
}
