import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Partner } from "../types/Partner";
import { getPartner } from "../api/Search";

function PartnerPage() {
  const { id } = useParams();
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    if (id) getPartner(Number(id)).then(setPartner);
  }, [id]);

  if (!partner) return <p className="text-center py-5">Loading...</p>;

  return (
    <div className="container py-4">
      <h1>{partner.partnerName}</h1>
      <table className="table">
        <tbody>
          <tr><th>Type</th><td>{partner.partnerType ?? "N/A"}</td></tr>
          <tr><th>Role</th><td>{partner.roleType ?? "N/A"}</td></tr>
          <tr><th>Contact</th><td>{partner.contactName ?? "N/A"}</td></tr>
          <tr><th>Email</th><td>{partner.email ?? "N/A"}</td></tr>
          <tr><th>Phone</th><td>{partner.phone ?? "N/A"}</td></tr>
          <tr><th>Region</th><td>{partner.region ?? "N/A"}</td></tr>
          <tr><th>Status</th><td>{partner.status ?? "N/A"}</td></tr>
          <tr><th>Start Date</th><td>{partner.startDate ?? "N/A"}</td></tr>
          <tr><th>End Date</th><td>{partner.endDate ?? "N/A"}</td></tr>
          <tr><th>Notes</th><td>{partner.notes ?? "N/A"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default PartnerPage;
