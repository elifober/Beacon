/** Shared picklists for admin “new profile” modals (align labels with what you store in Postgres). */

export const ENTITY_ACTIVE_INACTIVE_OPTIONS = ["Active", "Inactive"] as const;

export const PARTNER_TYPE_OPTIONS = [
  "Government",
  "NGO",
  "Corporate",
  "Faith-based",
  "School",
  "Individual",
  "International",
  "Other",
] as const;

export const PARTNER_ROLE_TYPE_OPTIONS = [
  "Funding partner",
  "Service provider",
  "Referral source",
  "Volunteer",
  "Advocacy",
  "Training",
  "In-kind donor",
  "Other",
] as const;
