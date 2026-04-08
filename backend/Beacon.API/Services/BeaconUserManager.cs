using Beacon.API.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Beacon.API.Services;

/// <summary>
/// Ensures every newly created account gets the Supporter (donor) role.
/// Admin and Partner are assigned only elsewhere (e.g. admin tooling or seed data).
/// </summary>
public class BeaconUserManager : UserManager<ApplicationUser>
{
    public BeaconUserManager(
        IUserStore<ApplicationUser> store,
        IOptions<IdentityOptions> optionsAccessor,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IEnumerable<IUserValidator<ApplicationUser>> userValidators,
        IEnumerable<IPasswordValidator<ApplicationUser>> passwordValidators,
        ILookupNormalizer keyNormalizer,
        IdentityErrorDescriber errors,
        IServiceProvider services,
        ILogger<UserManager<ApplicationUser>> logger)
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
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user)
    {
        var result = await base.CreateAsync(user);
        if (result.Succeeded)
        {
            await EnsureSupporterRoleAsync(user);
        }

        return result;
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
    {
        var result = await base.CreateAsync(user, password);
        if (result.Succeeded)
        {
            await EnsureSupporterRoleAsync(user);
        }

        return result;
    }

    private async Task EnsureSupporterRoleAsync(ApplicationUser user)
    {
        if (await IsInRoleAsync(user, AuthRoles.Supporter))
        {
            return;
        }

        await AddToRoleAsync(user, AuthRoles.Supporter);
    }
}
