import type { EducationRecord } from "./EducationRecord";
import type { HealthWellbeingRecord } from "./HealthWellbeingRecord";
import type { HomeVisitation } from "./HomeVisitation";
import type { IncidentReport } from "./IncidentReport";
import type { InterventionPlan } from "./InterventionPlan";
import type { ProcessRecording } from "./ProcessRecording";
import type { Safehouse } from "./Safehouse";

export interface Resident {
  residentId: number;

  firstName?: string;
  lastInitial?: string;

  caseControlNo?: string;
  internalCode?: string;

  safehouseId: number;

  caseStatus?: string;
  sex?: string;

  dateOfBirth?: string; // DateOnly → string (ISO)

  birthStatus?: string;
  placeOfBirth?: string;
  religion?: string;

  caseCategory?: string;

  subCatOrphaned?: boolean;
  subCatTrafficked?: boolean;
  subCatChildLabor?: boolean;
  subCatPhysicalAbuse?: boolean;
  subCatSexualAbuse?: boolean;
  subCatOsaec?: boolean;
  subCatCicl?: boolean;
  subCatAtRisk?: boolean;
  subCatStreetChild?: boolean;
  subCatChildWithHiv?: boolean;

  isPwd?: boolean;
  pwdType?: string;

  hasSpecialNeeds?: boolean;
  specialNeedsDiagnosis?: string;

  familyIs4ps?: boolean;
  familySoloParent?: boolean;
  familyIndigenous?: boolean;
  familyParentPwd?: boolean;
  familyInformalSettler?: boolean;

  dateOfAdmission?: string;
  ageUponAdmission?: string;
  presentAge?: string;
  lengthOfStay?: string;

  referralSource?: string;
  referringAgencyPerson?: string;

  dateColbRegistered?: string;
  dateColbObtained?: string;

  assignedSocialWorker?: string;
  initialCaseAssessment?: string;

  dateCaseStudyPrepared?: string;

  reintegrationType?: string;
  reintegrationStatus?: string;

  initialRiskLevel?: string;
  currentRiskLevel?: string;

  dateEnrolled?: string;
  dateClosed?: string;

  createdAt?: string; // DateTime → string (ISO)

  notesRestricted?: string;

  educationRecords: EducationRecord[];
  healthWellbeingRecords: HealthWellbeingRecord[];
  homeVisitations: HomeVisitation[];
  incidentReports: IncidentReport[];
  interventionPlans: InterventionPlan[];
  processRecordings: ProcessRecording[];

  safehouse: Safehouse;
}