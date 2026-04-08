import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Supporter } from "../types/Supporter";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

interface DonorFullHistoryItem {
  donationType?: string;
  donationDate: string;
  amount?: number;
  estimatedValue?: number;
  impactUnit?: string;
  notes?: string;
  programArea?: string;
}

interface DonorPageData {
  supporter: Supporter;
  donationHistory: DonorFullHistoryItem[];
}

function DonorPage() {
  const { id } = useParams();
  const [data, setData] = useState<DonorPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Donor/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Donor not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error ?? "Donor not found."}</div>
      </div>
    );
  }

  const { supporter, donationHistory } = data;
  const name = supporter.displayName
    ?? ([supporter.firstName, supporter.lastName].filter(Boolean).join(" ") || "Unknown");

  const mostRecent = donationHistory.length > 0 ? donationHistory[0] : null;

  const infoFields: [string, string | undefined | null][] = [
    ["Type", supporter.supporterType],
    ["Organization", supporter.organizationName],
    ["Email", supporter.email],
    ["Phone", supporter.phone],
    ["Region", supporter.region],
    ["Country", supporter.country],
    ["Status", supporter.status],
    ["Relationship", supporter.relationshipType],
    ["First Donation", supporter.firstDonationDate ? formatDate(supporter.firstDonationDate) : null],
    ["Acquisition Channel", supporter.acquisitionChannel],
  ];

  return (
    <div className="container py-4">
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <h1 className="mb-3">{name}</h1>
          <div className="card">
            <div className="card-body">
              <table className="table table-sm mb-0">
                <tbody>
                  {infoFields
                    .filter(([, value]) => value != null && value !== "")
                    .map(([label, value]) => (
                      <tr key={label}><th>{label}</th><td>{value}</td></tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {mostRecent && (
          <div className="col-lg-6">
            <h2 className="h5 mb-3">Most Recent Donation</h2>
            <div className="card">
              <div className="card-body">
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><th>Date</th><td>{formatDate(mostRecent.donationDate)}</td></tr>
                    <tr><th>Type</th><td>{mostRecent.donationType ?? "N/A"}</td></tr>
                    {mostRecent.amount != null && (
                      <tr><th>Amount</th><td>₱{mostRecent.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                    )}
                    {mostRecent.estimatedValue != null && (
                      <tr><th>Estimated Value</th><td>{mostRecent.estimatedValue.toLocaleString()} {mostRecent.impactUnit ?? ""}</td></tr>
                    )}
                    {mostRecent.programArea && (
                      <tr><th>Program Area</th><td>{mostRecent.programArea}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <h2 className="h5 mb-3">All Donations</h2>
      {donationHistory.length === 0 ? (
        <div className="alert alert-secondary">No donation history found.</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Estimated Value</th>
                  <th>Impact Unit</th>
                  <th>Program Area</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {donationHistory.map((item, i) => (
                  <tr key={i}>
                    <td>{formatDate(item.donationDate)}</td>
                    <td>{item.donationType ?? "N/A"}</td>
                    <td>
                      {item.amount != null
                        ? `₱${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td>
                      {item.estimatedValue != null
                        ? item.estimatedValue.toLocaleString()
                        : "—"}
                    </td>
                    <td>{item.impactUnit ?? "—"}</td>
                    <td>{item.programArea ?? "N/A"}</td>
                    <td>{item.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DonorPage;
