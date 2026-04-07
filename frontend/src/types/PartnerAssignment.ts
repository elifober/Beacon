export interface PartnerAssignment {
  assignmentId: number;
  partnerId: number;
  safehouseId?: number;
  programArea?: string;
  assignmentStart?: string;
  assignmentEnd?: string;
  responsibilityNotes?: string;
  isPrimary?: boolean;
  status?: string;
}
