using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Beacon.API.Models;

namespace Beacon.API.Data;

public class AuthIdentityDbContext : IdentityDbContext<ApplicationUser>, IDataProtectionKeyContext
{
    public AuthIdentityDbContext(DbContextOptions<AuthIdentityDbContext> options)
        : base(options)
    {
    }
    
    public DbSet<Supporter> Supporters { get; set; }
    public DbSet<Partner> Partners { get; set; }
    public DbSet<Donation> Donations { get; set; }
    public DbSet<DonationAllocation> DonationAllocations { get; set; }
    public DbSet<EducationRecord> EducationRecords { get; set; }
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords { get; set; }
    public DbSet<HomeVisitation> HomeVisitations { get; set; }
    public DbSet<IncidentReport> IncidentReports { get; set; }
    public DbSet<InKindDonationItem> InKindDonationItems { get; set; }
    public DbSet<InterventionPlan> InterventionPlans { get; set; }
    public DbSet<PartnerAssignment> PartnerAssignments { get; set; }
    public DbSet<ProcessRecording> ProcessRecordings { get; set; }
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots { get; set; }
    public DbSet<Resident>  Residents { get; set; }
    public DbSet<Safehouse> Safehouses { get; set; }
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics { get; set; }
    public DbSet<SocialMediaPost> SocialMediaPosts { get; set; }

    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; } = null!;

    /// <summary>
    /// Next <c>supporter_id</c> for inserts. Production DBs imported without PG IDENTITY leave the column NOT NULL
    /// with no default; callers must supply the key explicitly.
    /// </summary>
    public async Task<int> AllocateNextSupporterIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await Supporters
            .AsNoTracking()
            .OrderByDescending(s => s.SupporterId)
            .Select(s => s.SupporterId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    /// <summary>
    /// Next <c>resident_id</c> for inserts (same legacy-PK pattern as <see cref="AllocateNextSupporterIdAsync"/>).
    /// </summary>
    public async Task<int> AllocateNextResidentIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await Residents
            .AsNoTracking()
            .OrderByDescending(r => r.ResidentId)
            .Select(r => r.ResidentId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    /// <summary>
    /// Inserts a supporter row with an explicit <c>supporter_id</c>. Uses SQL so the key is never omitted
    /// (some legacy DBs have NOT NULL <c>supporter_id</c> without IDENTITY; EF can still omit the column).
    /// </summary>
    public Task InsertSupporterRowAsync(
        int supporterId,
        string email,
        string identityUserId,
        string displayName,
        string? firstName,
        string? lastName,
        string? organizationName,
        string? phone,
        DateTime createdAtUtc,
        string status,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO supporters (
                supporter_id,
                email,
                identity_user_id,
                display_name,
                first_name,
                last_name,
                organization_name,
                phone,
                created_at,
                status)
            VALUES (
                {supporterId},
                {email},
                {identityUserId},
                {displayName},
                {firstName},
                {lastName},
                {organizationName},
                {phone},
                {createdAtUtc},
                {status})",
            cancellationToken);
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // THIS MUST BE THE FIRST LINE IN THIS METHOD
        base.OnModelCreating(modelBuilder);
        
        
        modelBuilder.Entity<Supporter>(entity =>
        {
            entity.HasOne(s => s.IdentityUser)
                .WithMany()
                .HasForeignKey(s => s.IdentityUserId);
            entity.Property(s => s.SupporterId).ValueGeneratedNever();
        });

        modelBuilder.Entity<Resident>()
            .Property(r => r.ResidentId)
            .ValueGeneratedNever();

        // Partner (Admin/Staff) Foreign Key Mapping
        modelBuilder.Entity<Partner>()
            .HasOne(p => p.IdentityUser)
            .WithMany()
            .HasForeignKey(p => p.IdentityUserId);
    }
}
