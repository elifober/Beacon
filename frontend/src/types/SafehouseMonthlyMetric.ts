export interface SafehouseMonthlyMetric {
  metricId: number;
  safehouseId: number;
  monthStart: string;
  monthEnd: string;
  activeResidents?: number;
  avgEducationProgress?: number;
  avgHealthScore?: number;
  processRecordingCount?: number;
  homeVisitationCount?: number;
  incidentCount?: number;
  notes?: string;
}
