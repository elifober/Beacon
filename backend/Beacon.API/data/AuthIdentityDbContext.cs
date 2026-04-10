using Beacon.API.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;

namespace Beacon.API.Data;

public class AuthIdentityDbContext : IdentityDbContext<ApplicationUser>, IDataProtectionKeyContext
{
    public AuthIdentityDbContext(DbContextOptions<AuthIdentityDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Ensures <see cref="RelationalEventId.PendingModelChangesWarning"/> is ignored here, not only on
    /// <c>UseNpgsql</c> in DI. Some startup paths (e.g. <c>MigrateAsync</c>) otherwise still throw when the
    /// snapshot in the published assembly differs slightly from production expectations.
    /// </summary>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(w =>
            w.Ignore(RelationalEventId.PendingModelChangesWarning));
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
    public DbSet<ResidentMlScore> ResidentMlScores { get; set; }
    public DbSet<SupporterMlScore> SupporterMlScores { get; set; }

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

    public async Task<int> AllocateNextEducationRecordIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await EducationRecords
            .AsNoTracking()
            .OrderByDescending(e => e.EducationRecordId)
            .Select(e => e.EducationRecordId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    public async Task<int> AllocateNextHealthRecordIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await HealthWellbeingRecords
            .AsNoTracking()
            .OrderByDescending(h => h.HealthRecordId)
            .Select(h => h.HealthRecordId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    public async Task<int> AllocateNextProcessRecordingIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await ProcessRecordings
            .AsNoTracking()
            .OrderByDescending(p => p.RecordingId)
            .Select(p => p.RecordingId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    public async Task<int> AllocateNextHomeVisitationIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await HomeVisitations
            .AsNoTracking()
            .OrderByDescending(v => v.VisitationId)
            .Select(v => v.VisitationId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    public async Task<int> AllocateNextIncidentReportIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await IncidentReports
            .AsNoTracking()
            .OrderByDescending(i => i.IncidentId)
            .Select(i => i.IncidentId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    /// <summary>
    /// Next <c>partner_id</c> for admin inserts. Imported DBs often have integer PKs without PG IDENTITY.
    /// </summary>
    public async Task<int> AllocateNextPartnerIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await Partners
            .AsNoTracking()
            .OrderByDescending(p => p.PartnerId)
            .Select(p => p.PartnerId)
            .FirstOrDefaultAsync(cancellationToken);
        return maxId + 1;
    }

    /// <summary>
    /// Next <c>safehouse_id</c> for admin inserts (legacy/imported DBs without IDENTITY on the PK).
    /// </summary>
    public async Task<int> AllocateNextSafehouseIdAsync(CancellationToken cancellationToken = default)
    {
        var maxId = await Safehouses
            .AsNoTracking()
            .OrderByDescending(s => s.SafehouseId)
            .Select(s => s.SafehouseId)
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

    /// <summary>
    /// Inserts a resident with only the columns needed for admin create. Production schemas imported from CSV
    /// may omit columns the EF model maps (e.g. <c>family_is4ps</c>); raw SQL avoids generating INSERT …
    /// for every mapped property.
    /// </summary>
    public Task<int> InsertResidentRowAsync(
        int residentId,
        string? firstName,
        string? lastInitial,
        string? caseControlNo,
        string? internalCode,
        int safehouseId,
        string? caseStatus,
        string? sex,
        DateOnly? dateOfBirth,
        string? initialRiskLevel,
        string? currentRiskLevel,
        DateTime createdAtUtc,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO residents (
                resident_id,
                first_name,
                last_initial,
                case_control_no,
                internal_code,
                safehouse_id,
                case_status,
                sex,
                date_of_birth,
                initial_risk_level,
                current_risk_level,
                created_at
            ) VALUES (
                {residentId},
                {firstName},
                {lastInitial},
                {caseControlNo},
                {internalCode},
                {safehouseId},
                {caseStatus},
                {sex},
                {dateOfBirth},
                {initialRiskLevel},
                {currentRiskLevel},
                {createdAtUtc})",
            cancellationToken);
    }

    /// <summary>
    /// Inserts a partner row with only columns used by admin create (avoids schema drift on imported DBs).
    /// Uses an explicit <c>partner_id</c> so legacy DBs without IDENTITY behave like <see cref="InsertResidentRowAsync"/>.
    /// </summary>
    public Task InsertPartnerRowAsync(
        int partnerId,
        string partnerName,
        string? partnerType,
        string? roleType,
        string contactName,
        string? email,
        string? phone,
        string? region,
        string? status,
        DateOnly? startDate,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO partners (
                partner_id,
                partner_name, partner_type, role_type, contact_name, email, phone, region, status,
                start_date, end_date, notes, identity_user_id)
            VALUES (
                {partnerId},
                {partnerName},
                {partnerType},
                {roleType},
                {contactName},
                {email},
                {phone},
                {region},
                {status},
                {startDate},
                NULL,
                {notes},
                NULL)",
            cancellationToken);
    }

    /// <summary>
    /// Inserts a safehouse with explicit <c>safehouse_id</c>; temporary <c>safehouse_code</c>, then <c>SH-{id}</c>.
    /// </summary>
    public async Task<(int SafehouseId, string SafehouseCode)> InsertSafehouseRowAsync(
        int safehouseId,
        string name,
        string? region,
        string? city,
        string? province,
        string? country,
        DateOnly? openDate,
        string? status,
        int? capacityGirls,
        int? currentOccupancy,
        int? capacityStaff,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var tempCode = "TMP-" + Guid.NewGuid().ToString("N");
            await Database.ExecuteSqlInterpolatedAsync(
                $@"
                INSERT INTO safehouses (
                    safehouse_id,
                    safehouse_code, name, region, city, province, country, open_date, status,
                    capacity_girls, current_occupancy, capacity_staff, notes)
                VALUES (
                    {safehouseId},
                    {tempCode},
                    {name},
                    {region},
                    {city},
                    {province},
                    {country},
                    {openDate},
                    {status},
                    {capacityGirls},
                    {currentOccupancy},
                    {capacityStaff},
                    NULL)",
                cancellationToken);

            var finalCode = $"SH-{safehouseId}";
            await Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE safehouses SET safehouse_code = {finalCode} WHERE safehouse_id = {safehouseId}",
                cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return (safehouseId, finalCode);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// Admin create for <c>supporters</c>: explicit <c>supporter_id</c> and narrow column list.
    /// </summary>
    public Task InsertSupporterAdminRowAsync(
        int supporterId,
        string? supporterType,
        string displayName,
        string? firstName,
        string? lastName,
        string? relationshipType,
        string? region,
        string? email,
        string? phone,
        string status,
        DateTime createdAtUtc,
        string? acquisitionChannel,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO supporters (
                supporter_id,
                supporter_type,
                display_name,
                organization_name,
                first_name,
                last_name,
                relationship_type,
                region,
                country,
                email,
                phone,
                status,
                created_at,
                first_donation_date,
                acquisition_channel,
                identity_user_id)
            VALUES (
                {supporterId},
                {supporterType},
                {displayName},
                NULL,
                {firstName},
                {lastName},
                {relationshipType},
                {region},
                NULL,
                {email},
                {phone},
                {status},
                {createdAtUtc},
                NULL,
                {acquisitionChannel},
                NULL)",
            cancellationToken);
    }

    /// <summary>
    /// Deletes a resident and known child rows with SQL (no full-row SELECT). Skips
    /// <c>resident_ml_scores</c> when that optional table is absent (common on Railway imports).
    /// </summary>
    /// <returns>Number of rows deleted from <c>residents</c> (0 if none matched).</returns>
    public async Task<int> DeleteResidentCascadeByIdAsync(int residentId,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM education_records WHERE resident_id = {residentId}",
                cancellationToken);
            await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM health_wellbeing_records WHERE resident_id = {residentId}",
                cancellationToken);
            await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM home_visitations WHERE resident_id = {residentId}",
                cancellationToken);
            await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM incident_reports WHERE resident_id = {residentId}",
                cancellationToken);
            await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM intervention_plans WHERE resident_id = {residentId}",
                cancellationToken);
            await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM process_recordings WHERE resident_id = {residentId}",
                cancellationToken);

            try
            {
                await Database.ExecuteSqlInterpolatedAsync(
                    $"DELETE FROM resident_ml_scores WHERE resident_id = {residentId}",
                    cancellationToken);
            }
            catch (Exception ex) when (IsPostgresUndefinedTable(ex))
            {
            }

            var deleted = await Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM residents WHERE resident_id = {residentId}",
                cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return deleted;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static bool IsPostgresUndefinedTable(Exception ex)
    {
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException pg
                && string.Equals(pg.SqlState, PostgresErrorCodes.UndefinedTable, StringComparison.Ordinal))
                return true;
        }

        return false;
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

        // Legacy/imported tables: integer PKs without PG IDENTITY; inserts must supply keys explicitly.
        modelBuilder.Entity<EducationRecord>()
            .Property(e => e.EducationRecordId)
            .ValueGeneratedNever();
        modelBuilder.Entity<HealthWellbeingRecord>()
            .Property(h => h.HealthRecordId)
            .ValueGeneratedNever();
        modelBuilder.Entity<ProcessRecording>()
            .Property(p => p.RecordingId)
            .ValueGeneratedNever();
        modelBuilder.Entity<HomeVisitation>()
            .Property(v => v.VisitationId)
            .ValueGeneratedNever();
        modelBuilder.Entity<IncidentReport>()
            .Property(i => i.IncidentId)
            .ValueGeneratedNever();

        // Partner (Admin/Staff) Foreign Key Mapping
        modelBuilder.Entity<Partner>()
            .HasOne(p => p.IdentityUser)
            .WithMany()
            .HasForeignKey(p => p.IdentityUserId);

        modelBuilder.Entity<ResidentMlScore>(entity =>
        {
            entity.HasKey(e => e.ResidentId);
            entity.Property(e => e.ResidentId).ValueGeneratedNever();
        });

        modelBuilder.Entity<SupporterMlScore>(entity =>
        {
            entity.HasKey(e => e.SupporterId);
            entity.Property(e => e.SupporterId).ValueGeneratedNever();
        });
    }
}
