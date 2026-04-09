import type { Supporter } from "../types/Supporter";

interface DonorInfoProps {
  supporter: Supporter;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function DonorInfo({ supporter }: DonorInfoProps) {
  const name = supporter.displayName
    ?? ([supporter.firstName, supporter.lastName].filter(Boolean).join(" ") || "Unknown");

  const fields: [string, string | undefined | null][] = [
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
    <div className="card beacon-detail-card">
      <div className="card-body">
        <h2 className="card-title h5 mb-3">{name}</h2>
        <table className="table table-sm mb-0">
          <tbody>
            {fields
              .filter(([, value]) => value != null && value !== "")
              .map(([label, value]) => (
                <tr key={label}><th>{label}</th><td>{value}</td></tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DonorInfo;
