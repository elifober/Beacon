import { requireApiBaseUrl } from "../lib/apiBaseUrl";

export type SubmitMonetaryDonationResult = {
  donationId: number;
};

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return fallback;
  }
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      const sqlState = typeof o.sqlState === "string" ? o.sqlState : null;
      const constraint =
        typeof o.constraintName === "string" && o.constraintName.length > 0
          ? o.constraintName
          : null;
      const base =
        (typeof o.message === "string" && o.message.length > 0
          ? o.message
          : typeof o.detail === "string" && o.detail.length > 0
            ? o.detail
            : typeof o.title === "string" && o.title.length > 0
              ? o.title
              : null) ?? fallback;
      const extra = [sqlState ? `SQL ${sqlState}` : null, constraint ? `constraint ${constraint}` : null]
        .filter(Boolean)
        .join(" · ");
      return extra.length > 0 ? `${base} (${extra})` : base;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Records a monetary donation for the signed-in supporter (cookies). */
export async function submitMonetaryDonation(args: {
  amount: number;
  isRecurring: boolean;
}): Promise<SubmitMonetaryDonationResult> {
  const url = new URL("/Beacon/DonorSelf/MonetaryDonation", requireApiBaseUrl()).toString();
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: args.amount,
      isRecurring: args.isRecurring,
    }),
  });

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Please sign in to record your donation."
        : response.status === 403
          ? "Your account cannot record donations. Use a donor account that is linked to a profile."
          : `Could not save donation (${response.status}).`;
    throw new Error(await readErrorMessage(response, fallback));
  }

  return (await response.json()) as SubmitMonetaryDonationResult;
}
