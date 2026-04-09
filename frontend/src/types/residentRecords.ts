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
  incidentDate: string;
  incidentType?: string;
  severity?: string;
  resolved?: boolean;
  resolutionDate?: string;
  reportedBy?: string;
  followUpRequired?: boolean;
  safehouseCity?: string;
}

export interface ResidentDetail {
  name: string;
  dateOfBirth?: string;
  sex?: string;
  caseStatus?: string;
  safehouseCity?: string;
  lengthOfStay?: string;
  currentRiskLevel?: string;
  educationRecords?: EducationRecordRow[];
  healthWellbeingRecords?: HealthWellbeingRow[];
  processRecordings?: ProcessRecordingRow[];
  homeVisitations?: HomeVisitationRow[];
  incidentReports?: IncidentReportRow[];
}
