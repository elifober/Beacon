import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Supporter } from "../types/Supporter";
import { getDonor } from "../api/Search";

function DonorPage() {
  const { id } = useParams();
  const [donor, setDonor] = useState<Supporter | null>(null);

  useEffect(() => {
    if (id) getDonor(Number(id)).then(setDonor);
  }, [id]);

  if (!donor) return <p className="text-center py-5">Loading...</p>;

  return (
    <div className="container py-4">
      <h1>{donor.displayName ?? `${donor.firstName} ${donor.lastName}`}</h1>
      <table className="table">
        <tbody>
          <tr><th>Type</th><td>{donor.supporterType ?? "N/A"}</td></tr>
          <tr><th>Organization</th><td>{donor.organizationName ?? "N/A"}</td></tr>
          <tr><th>Email</th><td>{donor.email ?? "N/A"}</td></tr>
          <tr><th>Phone</th><td>{donor.phone ?? "N/A"}</td></tr>
          <tr><th>Region</th><td>{donor.region ?? "N/A"}</td></tr>
          <tr><th>Country</th><td>{donor.country ?? "N/A"}</td></tr>
          <tr><th>Status</th><td>{donor.status ?? "N/A"}</td></tr>
          <tr><th>Relationship</th><td>{donor.relationshipType ?? "N/A"}</td></tr>
          <tr><th>First Donation</th><td>{donor.firstDonationDate ?? "N/A"}</td></tr>
          <tr><th>Acquisition Channel</th><td>{donor.acquisitionChannel ?? "N/A"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default DonorPage;
