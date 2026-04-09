import { BASE_URL } from "../config/api";

// Note: BASE_URL points at "/Beacon", but the Risk controller lives at "/Risk".
// Swap the suffix so we share the same origin/proxy config.
const RISK_BASE = BASE_URL.replace(/\/Beacon$/, "") + "/Risk";

export interface ResidentRisk {
  residentId: number;
  name: string;
  safehouseCity: string | null;
  caseStatus: string | null;
  incidentRiskScore: number | null;
  incidentRiskBand: string | null;
  reintegrationScore: number | null;
  reintegrationBand: string | null;
}

export interface SupporterRisk {
  supporterId: number;
  name: string;
  supporterType: string | null;
  status: string | null;
  churnProbability: number | null;
  riskTier: string | null;
}

export interface RiskSummary {
  residentIncidentBands: { band: string; count: number }[];
  residentReintegrationBands: { band: string; count: number }[];
  supporterChurnTiers: { tier: string; count: number }[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${RISK_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getResidentRisks  = () => getJson<ResidentRisk[]>("/Residents");
export const getSupporterRisks = () => getJson<SupporterRisk[]>("/Supporters");
export const getRiskSummary    = () => getJson<RiskSummary>("/Summary");
