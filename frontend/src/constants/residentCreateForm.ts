/** Case / program status options for new resident intake (matches typical `case_status` values). */
export const RESIDENT_CASE_STATUS_OPTIONS: readonly string[] = [
  "Active",
  "Pending",
  "Inactive",
  "Closed",
  "Transferred",
  "On hold",
];

/** `birth_status` intake values. */
export const RESIDENT_BIRTH_STATUS_OPTIONS: readonly string[] = [
  "Marital",
  "Non-Marital",
];

/** Typical `case_category` values — include “Other” plus freeform via mergePicklistOption. */
export const RESIDENT_CASE_CATEGORY_OPTIONS: readonly string[] = [
  "Abandoned",
  "Neglected",
  "Abuse",
  "Trafficking",
  "Child labor",
  "At risk",
  "Street child",
  "Orphaned",
  "Other",
];

/** Risk levels aligned with incident severity picklists elsewhere in Beacon. */
export const RESIDENT_RISK_LEVEL_OPTIONS: readonly string[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];
