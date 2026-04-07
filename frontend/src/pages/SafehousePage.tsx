import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Safehouse } from "../types/Safehouse";
import { getSafehouse } from "../api/Search";

function SafehousePage() {
  const { id } = useParams();
  const [safehouse, setSafehouse] = useState<Safehouse | null>(null);

  useEffect(() => {
    if (id) getSafehouse(Number(id)).then(setSafehouse);
  }, [id]);

  if (!safehouse) return <p className="text-center py-5">Loading...</p>;

  return (
    <div className="container py-4">
      <h1>{safehouse.name}</h1>
      <table className="table">
        <tbody>
          <tr><th>Code</th><td>{safehouse.safehouseCode}</td></tr>
          <tr><th>Region</th><td>{safehouse.region ?? "N/A"}</td></tr>
          <tr><th>City</th><td>{safehouse.city ?? "N/A"}</td></tr>
          <tr><th>Province</th><td>{safehouse.province ?? "N/A"}</td></tr>
          <tr><th>Country</th><td>{safehouse.country ?? "N/A"}</td></tr>
          <tr><th>Status</th><td>{safehouse.status ?? "N/A"}</td></tr>
          <tr><th>Open Date</th><td>{safehouse.openDate ?? "N/A"}</td></tr>
          <tr><th>Capacity (Girls)</th><td>{safehouse.capacityGirls ?? "N/A"}</td></tr>
          <tr><th>Capacity (Staff)</th><td>{safehouse.capacityStaff ?? "N/A"}</td></tr>
          <tr><th>Current Occupancy</th><td>{safehouse.currentOccupancy ?? "N/A"}</td></tr>
          <tr><th>Notes</th><td>{safehouse.notes ?? "N/A"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default SafehousePage;
