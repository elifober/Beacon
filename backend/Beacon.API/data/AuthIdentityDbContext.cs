using System.Data;
using Beacon.API.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
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
    /// Inserts a safehouse; assigns a temporary unique <c>safehouse_code</c>, then sets <c>SH-{id}</c>.
    /// </summary>
    public async Task<(int SafehouseId, string SafehouseCode)> InsertSafehouseRowAsync(
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
            var id = await ExecuteInsertReturningIntAsync(
                """
                INSERT INTO safehouses (
                    safehouse_code, name, region, city, province, country, open_date, status,
                    capacity_girls, current_occupancy, capacity_staff, notes)
                VALUES (
                    @code, @name, @region, @city, @province, @country, @open_date, @status,
                    @cap_girls, @occ, @cap_staff, NULL)
                RETURNING safehouse_id
                """,
                cmd =>
                {
                    cmd.Parameters.AddWithValue("code", tempCode);
                    cmd.Parameters.AddWithValue("name", name);
                    cmd.Parameters.AddWithValue("region", (object?)region ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("city", (object?)city ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("province", (object?)province ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("country", (object?)country ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("open_date", (object?)openDate ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("status", (object?)status ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("cap_girls", (object?)capacityGirls ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("occ", (object?)currentOccupancy ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("cap_staff", (object?)capacityStaff ?? DBNull.Value);
                },
                cancellationToken);

            var finalCode = $"SH-{id}";
            await Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE safehouses SET safehouse_code = {finalCode} WHERE safehouse_id = {id}",
                cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return (id, finalCode);
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

    private async Task<int> ExecuteInsertReturningIntAsync(
        string sql,
        Action<NpgsqlCommand> bind,
        CancellationToken cancellationToken)
    {
        var conn = (NpgsqlConnection)Database.GetDbConnection();
        var hadTransaction = Database.CurrentTransaction != null;
        var openedHere = conn.State != ConnectionState.Open;
        if (openedHere)
            await Database.OpenConnectionAsync(cancellationToken);

        try
        {
            await using var cmd = new NpgsqlCommand(sql, conn);
            var tx = Database.CurrentTransaction?.GetDbTransaction();
            if (tx != null)
                cmd.Transaction = (NpgsqlTransaction)tx;
            bind(cmd);
            var scalar = await cmd.ExecuteScalarAsync(cancellationToken);
            if (scalar is null || scalar is DBNull)
                throw new InvalidOperationException("INSERT … RETURNING did not return a value.");
            return Convert.ToInt32(scalar, System.Globalization.CultureInfo.InvariantCulture);
        }
        finally
        {
            if (openedHere && !hadTransaction)
                await Database.CloseConnectionAsync();
        }
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
