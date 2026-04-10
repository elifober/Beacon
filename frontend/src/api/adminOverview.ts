import { BASE_URL } from "../config/api";

export type AdminOverviewStats = {
  totalResidentsServed: number;
  currentResidents: number;
  activeSafehouses: number;
  totalPartners: number;
  totalSupporters: number;
  donationsLast30Days: number;
  incidentsLast7Days: number;
  unresolvedIncidents: number;
  safehousesOverCapacity: number;
  residentsMissingRiskLevel: number;
};

function pickNum(o: Record<string, unknown>, camel: string, pascal: string): number {
  const v = o[camel] ?? o[pascal];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

export function parseAdminOverviewStats(raw: unknown): AdminOverviewStats | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const totalResidentsServed = pickNum(o, "totalResidentsServed", "TotalResidentsServed");
  const currentResidents = pickNum(o, "currentResidents", "CurrentResidents");
  const activeSafehouses = pickNum(o, "activeSafehouses", "ActiveSafehouses");
  const totalPartners = pickNum(o, "totalPartners", "TotalPartners");
  const totalSupporters = pickNum(o, "totalSupporters", "TotalSupporters");
  const donationsLast30Days = pickNum(o, "donationsLast30Days", "DonationsLast30Days");
  const incidentsLast7Days = pickNum(o, "incidentsLast7Days", "IncidentsLast7Days");
  const unresolvedIncidents = pickNum(o, "unresolvedIncidents", "UnresolvedIncidents");
  const safehousesOverCapacity = pickNum(o, "safehousesOverCapacity", "SafehousesOverCapacity");
  const residentsMissingRiskLevel = pickNum(o, "residentsMissingRiskLevel", "ResidentsMissingRiskLevel");

  const nums = [
    totalResidentsServed,
    currentResidents,
    activeSafehouses,
    totalPartners,
    totalSupporters,
    donationsLast30Days,
    incidentsLast7Days,
    unresolvedIncidents,
    safehousesOverCapacity,
    residentsMissingRiskLevel,
  ];
  if (nums.some((n) => Number.isNaN(n))) return null;

  return {
    totalResidentsServed,
    currentResidents,
    activeSafehouses,
    totalPartners,
    totalSupporters,
    donationsLast30Days,
    incidentsLast7Days,
    unresolvedIncidents,
    safehousesOverCapacity,
    residentsMissingRiskLevel,
  };
}

export async function fetchAdminOverviewStats(): Promise<AdminOverviewStats | null> {
  try {
    const url = new URL("Admin/OverviewStats", `${BASE_URL}/`);
    const res = await fetch(url.toString(), { credentials: "include" });
    if (res.status === 401 || res.status === 403) {
      return null;
    }
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    return parseAdminOverviewStats(raw);
  } catch {
    return null;
  }
}

