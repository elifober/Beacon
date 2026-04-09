import { BASE_URL } from "../config/api";

export type ImpactPublicStats = {
  totalResidentsServed: number;
  residentialShelters: number;
  currentResidents: number;
  yearsOfOperation: number;
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

/** Accept camelCase or PascalCase JSON from the API. */
export function parseImpactPublicStats(raw: unknown): ImpactPublicStats | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const totalResidentsServed = pickNum(o, "totalResidentsServed", "TotalResidentsServed");
  const residentialShelters = pickNum(o, "residentialShelters", "ResidentialShelters");
  const currentResidents = pickNum(o, "currentResidents", "CurrentResidents");
  const yearsOfOperation = pickNum(o, "yearsOfOperation", "YearsOfOperation");
  if (
    [totalResidentsServed, residentialShelters, currentResidents, yearsOfOperation].some((n) =>
      Number.isNaN(n),
    )
  ) {
    return null;
  }
  return {
    totalResidentsServed,
    residentialShelters,
    currentResidents,
    yearsOfOperation,
  };
}

/** Public aggregates for the Impact page (`Beacon/Impact/PublicStats`). */
export async function fetchImpactPublicStats(): Promise<ImpactPublicStats | null> {
  try {
    const url = new URL("Impact/PublicStats", `${BASE_URL}/`);
    const res = await fetch(url.toString(), { credentials: "omit" });
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    return parseImpactPublicStats(raw);
  } catch {
    return null;
  }
}
