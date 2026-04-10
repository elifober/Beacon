/** Case / program status options for new resident intake (matches typical `case_status` values). */
export const RESIDENT_CASE_STATUS_OPTIONS: readonly string[] = [
  "Active",
  "Pending",
  "Inactive",
  "Closed",
  "Transferred",
  "On hold",
];

/** Risk levels aligned with incident severity picklists elsewhere in Beacon. */
export const RESIDENT_RISK_LEVEL_OPTIONS: readonly string[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];
