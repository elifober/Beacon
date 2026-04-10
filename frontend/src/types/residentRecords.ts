export interface EducationRecordRow {
  educationRecordId: number;
  recordDate: string;
  educationLevel?: string;
  schoolName?: string;
  enrollmentStatus?: string;
  attendanceRate?: number;
  progressPercent?: number;
  completionStatus?: string;
  notes?: string;
}

export interface HealthWellbeingRow {
  healthRecordId: number;
  recordDate: string;
  generalHealthScore?: number;
  nutritionScore?: number;
  sleepQualityScore?: number;
  energyLevelScore?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  medicalCheckupDone?: boolean;
  dentalCheckupDone?: boolean;
  psychologicalCheckupDone?: boolean;
  notes?: string;
}

export interface ProcessRecordingRow {
  recordingId: number;
  sessionDate: string;
  socialWorker?: string;
  sessionType?: string;
  sessionDurationMinutes?: number;
  emotionalStateObserved?: string;
  emotionalStateEnd?: string;
  interventionsApplied?: string;
  followUpActions?: string;
  progressNoted?: boolean;
  concernsFlagged?: boolean;
  referralMade?: boolean;
  sessionNarrative?: string;
  notesRestricted?: string;
}

export interface HomeVisitationRow {
  visitationId: number;
  visitDate: string;
  socialWorker?: string;
  visitType?: string;
  locationVisited?: string;
  familyMembersPresent?: string;
  purpose?: string;
  observations?: string;
  familyCooperationLevel?: string;
  safetyConcernsNoted?: boolean;
  followUpNeeded?: boolean;
  followUpNotes?: string;
  visitOutcome?: string;
}

export interface IncidentReportRow {
  incidentId: number;
  /** Present when loaded from GET Resident; required for update prefills. */
  safehouseId?: number;
  incidentDate: string;
  incidentType?: string;
  severity?: string;
  description?: string;
  responseTaken?: string;
  resolved?: boolean;
  resolutionDate?: string;
  reportedBy?: string;
  followUpRequired?: boolean;
  safehouseCity?: string;
}

export interface SafehousePartnerRow {
  partnerId: number;
  partnerName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  programArea?: string;
  isPrimary?: boolean;
  assignmentStatus?: string;
}

export interface ResidentDetail {
  /** Present on GET Resident (camelCase JSON). Used for admin edit modal. */
  residentId?: number;
  firstName?: string;
  lastInitial?: string;
  caseControlNo?: string;
  internalCode?: string;
  initialRiskLevel?: string;
  name: string;
  dateOfBirth?: string;
  sex?: string;
  caseStatus?: string;
  /** Resident's assigned safehouse (for incident create prefill). */
  safehouseId?: number;
  safehouseCity?: string;
  lengthOfStay?: string;
  currentRiskLevel?: string;
  /** Partners with an active assignment to this safehouse (contact for care coordination). */
  safehousePartners?: SafehousePartnerRow[];
  educationRecords?: EducationRecordRow[];
  healthWellbeingRecords?: HealthWellbeingRow[];
  processRecordings?: ProcessRecordingRow[];
  homeVisitations?: HomeVisitationRow[];
  incidentReports?: IncidentReportRow[];
}
