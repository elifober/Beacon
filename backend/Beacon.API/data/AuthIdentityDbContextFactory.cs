using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Beacon.API.Data;

public class AuthIdentityDbContextFactory : IDesignTimeDbContextFactory<AuthIdentityDbContext>
{
    public AuthIdentityDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();
        

        var optionsBuilder = new DbContextOptionsBuilder<AuthIdentityDbContext>();
        optionsBuilder.UseNpgsql(configuration.GetConnectionString("BeaconConnection"))
            .UseSnakeCaseNamingConvention();

        return new AuthIdentityDbContext(optionsBuilder.Options);
        
        
    }
}
