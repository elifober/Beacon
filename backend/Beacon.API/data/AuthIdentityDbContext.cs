using System.Data;
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
    /// Inserts <c>donations</c> and one <c>donation_allocations</c> row using explicit PKs. Production DBs
    /// imported without PostgreSQL IDENTITY on these columns reject EF-generated INSERTs (500); this matches
    /// the manual-key pattern used for residents and supporters.
    /// </summary>
    public async Task<int> InsertMonetaryDonationForSupporterAsync(
        int supporterId,
        int safehouseId,
        decimal amount,
        bool isRecurring,
        DateOnly donationDate,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            var maxDonationId = await Donations
                .AsNoTracking()
                .OrderByDescending(d => d.DonationId)
                .Select(d => d.DonationId)
                .FirstOrDefaultAsync(cancellationToken);
            var donationId = maxDonationId + 1;

            var maxAllocationId = await DonationAllocations
                .AsNoTracking()
                .OrderByDescending(a => a.AllocationId)
                .Select(a => a.AllocationId)
                .FirstOrDefaultAsync(cancellationToken);
            var allocationId = maxAllocationId + 1;

            await Database.ExecuteSqlInterpolatedAsync(
                $@"
                INSERT INTO donations (
                    donation_id,
                    supporter_id,
                    donation_type,
                    donation_date,
                    is_recurring,
                    campaign_name,
                    channel_source,
                    currency_code,
                    amount,
                    estimated_value,
                    impact_unit,
                    notes,
                    referral_post_id
                ) VALUES (
                    {donationId},
                    {supporterId},
                    {"monetary"},
                    {donationDate},
                    {isRecurring},
                    NULL,
                    {"direct"},
                    {"PHP"},
                    {amount},
                    {amount},
                    {"pesos"},
                    NULL,
                    NULL
                )",
                cancellationToken);

            await Database.ExecuteSqlInterpolatedAsync(
                $@"
                INSERT INTO donation_allocations (
                    allocation_id,
                    donation_id,
                    safehouse_id,
                    program_area,
                    amount_allocated,
                    allocation_date,
                    allocation_notes
                ) VALUES (
                    {allocationId},
                    {donationId},
                    {safehouseId},
                    NULL,
                    {amount},
                    {donationDate},
                    NULL
                )",
                cancellationToken);

            await tx.CommitAsync(cancellationToken);
            return donationId;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
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
        string? religion,
        string? sex,
        DateOnly? dateOfBirth,
        string? caseCategory,
        DateOnly? dateOfAdmission,
        string? caseControlNo,
        string? internalCode,
        int safehouseId,
        string? caseStatus,
        string? initialRiskLevel,
        string? currentRiskLevel,
        string? birthStatus,
        string? placeOfBirth,
        bool? familyIs4ps,
        bool? familySoloParent,
        bool? familyIndigenous,
        bool? familyParentPwd,
        bool? subCatOrphaned,
        bool? subCatTrafficked,
        bool? subCatChildLabor,
        bool? subCatPhysicalAbuse,
        bool? subCatSexualAbuse,
        bool? subCatOsaec,
        bool? subCatCicl,
        bool? subCatAtRisk,
        bool? subCatStreetChild,
        bool? subCatChildWithHiv,
        bool? isPwd,
        string? pwdType,
        bool? hasSpecialNeeds,
        string? specialNeedsDiagnosis,
        DateTime createdAtUtc,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO residents (
                resident_id,
                first_name,
                last_initial,
                religion,
                sex,
                date_of_birth,
                case_category,
                date_of_admission,
                case_control_no,
                internal_code,
                safehouse_id,
                case_status,
                initial_risk_level,
                current_risk_level,
                birth_status,
                place_of_birth,
                family_is_4ps,
                family_solo_parent,
                family_indigenous,
                family_parent_pwd,
                sub_cat_orphaned,
                sub_cat_trafficked,
                sub_cat_child_labor,
                sub_cat_physical_abuse,
                sub_cat_sexual_abuse,
                sub_cat_osaec,
                sub_cat_cicl,
                sub_cat_at_risk,
                sub_cat_street_child,
                sub_cat_child_with_hiv,
                is_pwd,
                pwd_type,
                has_special_needs,
                special_needs_diagnosis,
                created_at
            ) VALUES (
                {residentId},
                {firstName},
                {lastInitial},
                {religion},
                {sex},
                {dateOfBirth},
                {caseCategory},
                {dateOfAdmission},
                {caseControlNo},
                {internalCode},
                {safehouseId},
                {caseStatus},
                {initialRiskLevel},
                {currentRiskLevel},
                {birthStatus},
                {placeOfBirth},
                {familyIs4ps},
                {familySoloParent},
                {familyIndigenous},
                {familyParentPwd},
                {subCatOrphaned},
                {subCatTrafficked},
                {subCatChildLabor},
                {subCatPhysicalAbuse},
                {subCatSexualAbuse},
                {subCatOsaec},
                {subCatCicl},
                {subCatAtRisk},
                {subCatStreetChild},
                {subCatChildWithHiv},
                {isPwd},
                {pwdType},
                {hasSpecialNeeds},
                {specialNeedsDiagnosis},
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

    /// <summary>Admin update: same narrow column set as <see cref="InsertResidentRowAsync"/> (no <c>created_at</c> change).</summary>
    public Task<int> UpdateResidentRowAsync(
        int residentId,
        string? firstName,
        string? lastInitial,
        string? religion,
        string? sex,
        DateOnly? dateOfBirth,
        string? caseCategory,
        DateOnly? dateOfAdmission,
        string? caseControlNo,
        string? internalCode,
        int safehouseId,
        string? caseStatus,
        string? initialRiskLevel,
        string? currentRiskLevel,
        string? birthStatus,
        string? placeOfBirth,
        bool? familyIs4ps,
        bool? familySoloParent,
        bool? familyIndigenous,
        bool? familyParentPwd,
        bool? subCatOrphaned,
        bool? subCatTrafficked,
        bool? subCatChildLabor,
        bool? subCatPhysicalAbuse,
        bool? subCatSexualAbuse,
        bool? subCatOsaec,
        bool? subCatCicl,
        bool? subCatAtRisk,
        bool? subCatStreetChild,
        bool? subCatChildWithHiv,
        bool? isPwd,
        string? pwdType,
        bool? hasSpecialNeeds,
        string? specialNeedsDiagnosis,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            UPDATE residents SET
                first_name = {firstName},
                last_initial = {lastInitial},
                religion = {religion},
                sex = {sex},
                date_of_birth = {dateOfBirth},
                case_category = {caseCategory},
                date_of_admission = {dateOfAdmission},
                case_control_no = {caseControlNo},
                internal_code = {internalCode},
                safehouse_id = {safehouseId},
                case_status = {caseStatus},
                initial_risk_level = {initialRiskLevel},
                current_risk_level = {currentRiskLevel},
                birth_status = {birthStatus},
                place_of_birth = {placeOfBirth},
                family_is_4ps = {familyIs4ps},
                family_solo_parent = {familySoloParent},
                family_indigenous = {familyIndigenous},
                family_parent_pwd = {familyParentPwd},
                sub_cat_orphaned = {subCatOrphaned},
                sub_cat_trafficked = {subCatTrafficked},
                sub_cat_child_labor = {subCatChildLabor},
                sub_cat_physical_abuse = {subCatPhysicalAbuse},
                sub_cat_sexual_abuse = {subCatSexualAbuse},
                sub_cat_osaec = {subCatOsaec},
                sub_cat_cicl = {subCatCicl},
                sub_cat_at_risk = {subCatAtRisk},
                sub_cat_street_child = {subCatStreetChild},
                sub_cat_child_with_hiv = {subCatChildWithHiv},
                is_pwd = {isPwd},
                pwd_type = {pwdType},
                has_special_needs = {hasSpecialNeeds},
                special_needs_diagnosis = {specialNeedsDiagnosis}
            WHERE resident_id = {residentId}",
            cancellationToken);
    }

    public Task<int> UpdatePartnerRowAsync(
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
            UPDATE partners SET
                partner_name = {partnerName},
                partner_type = {partnerType},
                role_type = {roleType},
                contact_name = {contactName},
                email = {email},
                phone = {phone},
                region = {region},
                status = {status},
                start_date = {startDate},
                notes = {notes}
            WHERE partner_id = {partnerId}",
            cancellationToken);
    }

    /// <summary>Admin update; does not change <c>safehouse_code</c>.</summary>
    public Task<int> UpdateSafehouseRowAsync(
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
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            UPDATE safehouses SET
                name = {name},
                region = {region},
                city = {city},
                province = {province},
                country = {country},
                open_date = {openDate},
                status = {status},
                capacity_girls = {capacityGirls},
                current_occupancy = {currentOccupancy},
                capacity_staff = {capacityStaff}
            WHERE safehouse_id = {safehouseId}",
            cancellationToken);
    }

    public Task<int> UpdateSupporterAdminRowAsync(
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
        string? acquisitionChannel,
        CancellationToken cancellationToken = default)
    {
        return Database.ExecuteSqlInterpolatedAsync(
            $@"
            UPDATE supporters SET
                supporter_type = {supporterType},
                display_name = {displayName},
                first_name = {firstName},
                last_name = {lastName},
                relationship_type = {relationshipType},
                region = {region},
                email = {email},
                phone = {phone},
                status = {status},
                acquisition_channel = {acquisitionChannel}
            WHERE supporter_id = {supporterId}",
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

        modelBuilder.Entity<Resident>(entity =>
        {
            entity.Property(r => r.ResidentId).ValueGeneratedNever();
            // Imported / legacy DBs use family_is_4ps (not family_is4ps).
            entity.Property(r => r.FamilyIs4ps).HasColumnName("family_is_4ps");
        });

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
