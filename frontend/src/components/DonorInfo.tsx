import type { Supporter } from "../types/Supporter";

interface DonorInfoProps {
  supporter: Supporter;
}

function DonorInfo({ supporter }: DonorInfoProps) {
  const name = supporter.displayName
    ?? [supporter.firstName, supporter.lastName].filter(Boolean).join(" ")
    || "Unknown";

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title h5 mb-3">{name}</h2>
        <table className="table table-sm mb-0">
          <tbody>
            <tr><th>Type</th><td>{supporter.supporterType ?? "N/A"}</td></tr>
            <tr><th>Organization</th><td>{supporter.organizationName ?? "N/A"}</td></tr>
            <tr><th>Email</th><td>{supporter.email ?? "N/A"}</td></tr>
            <tr><th>Phone</th><td>{supporter.phone ?? "N/A"}</td></tr>
            <tr><th>Region</th><td>{supporter.region ?? "N/A"}</td></tr>
            <tr><th>Country</th><td>{supporter.country ?? "N/A"}</td></tr>
            <tr><th>Status</th><td>{supporter.status ?? "N/A"}</td></tr>
            <tr><th>Relationship</th><td>{supporter.relationshipType ?? "N/A"}</td></tr>
            <tr><th>First Donation</th><td>{supporter.firstDonationDate ?? "N/A"}</td></tr>
            <tr><th>Acquisition Channel</th><td>{supporter.acquisitionChannel ?? "N/A"}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DonorInfo;
